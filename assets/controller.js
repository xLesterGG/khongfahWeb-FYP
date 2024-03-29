// var app = angular.module("myApp",['ui.router','ngMaterial','ngCookies']);
var app = angular.module("myApp",['ui.router','ngCookies']);

document.addEventListener('DOMContentLoaded', function () { // for notifications
    if (!Notification) {
        alert('Desktop notifications not available in your browser. Try Chrome.');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
});


// app.config(function($mdThemingProvider,$mdIconProvider) {
//   $mdThemingProvider.theme('default')
//     .primaryPalette('blue')
//     .accentPalette('pink');
// });
//
// app.run(function ($rootScope,$timeout) {
//     $rootScope.$on('$viewContentLoaded', ()=> {
//       $timeout(() => {
//         componentHandler.upgradeAllRegistered();
//       })
//     })
// }); // register mdl elemenets


if(location.origin.includes("3000")){
    var socket= io.connect("http://localhost:3000");
    // console.log("3000");
}
else{
    var socket= io.connect(location.origin);
}

// if(firebase.apps.length === 0){
//     socket.emit("getConfig");
// }

var config = {};
var fbApp;
var defaultStorage ;
var database ;


socket.on("getConfig",(c)=>{

    // console.log();
    // console.log('getting on chat');
    config = c;
    // firebase.initializeApp(config);
    fbApp = firebase.initializeApp(config);
    defaultStorage  = fbApp.storage().ref();
    database = fbApp.database();

    fbApp.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user
            var z = database.ref('/users').once('value')
            .then((res)=>{
                var b = false;

                for(var x in res.val()){
                    //  us[x] = res.val()[x];
                    if(res.val()[x].email == user.email && 'type' in res.val()[x] && res.val()[x].type =='admin'){
                        b = true;
                        break;
                    }
                }

                if(!b){
                    alert("You are not an admin. ");
                    fbApp.auth().signOut()
                    location.reload();
                }else{
                    if(location.hash.includes("login"))
                    {
                        window.location.href = location.origin+ "/#!/home/inbox";
                    }
                    // console.log("logged in");
                }
            });



        } else {
            // console.log("not logged in");

            if(!location.hash.includes("login")){
                window.location.href = location.origin+ "/#!/login";

            }
        }

    });
});


app.controller("loginCtrl",($scope,$state,$cookieStore)=>{

    $scope.login = (email,pass)=>{

        fbApp.auth().signInWithEmailAndPassword(email, pass)
        .catch((error)=>{

            // console.log(error);
            var errorCode = error.code;
            var errorMessage = error.message;

            if(errorCode == 'auth/wrong-password'){
                alert("Wrong password, please try again");
            }else if(errorCode == 'auth/user-not-found'){
                alert("No such account, please try again");
            }else{
                alert(errorMessage);
            }
            location.reload();

        });


    };


    $scope.showlogin = true;
    $scope.showsignup = false;

    $scope.register = (email,pass,code)=>{
        console.log(email + pass);
        if(code != "123abc"){
            alert("Invalid Registration key");
        }else{
            console.log("Signup");
            socket.emit("registerUser",email,pass);
        }
    };

    $scope.resetPassword = (email)=>{
        socket.emit("resetPassword",email);
    };

    socket.on("errorMsg",(err)=>{
        alert(err);
        location.reload();
    });




    socket.on("registersuccess",()=>{
        location.reload();
        alert("Registered successfully!");
    });

    // socket.on("notAdmin",()=>{
    //     alert("You are not an admin. ");
    //     location.reload();
    // });

    socket.on("resetSuccessful",(mess)=>{
        alert(mess);
        location.reload();
    });



    socket.on("redirectToLogin",(user)=>{
        $state.go('login');

    });

});

app.controller("historyCtrl",($scope,inqService,userService)=>{
    // console.log(firebase.apps.length);

    fbApp.auth().onAuthStateChanged(function(user) {
        if (!user){
            console.log("not logged in");
            window.location.href = location.origin+ "/#!/login";
        }

    });

    $scope.orderByField = 'time';
    $scope.reverseSort = false;



    $scope.reload =()=>{
        // console.log('reloadings');
        location.reload();
    }

    $scope.$watch(function() {
        return inqService.getInq();
    }, function() {
        $scope.getInq();
    });

    $scope.$watch(function() {
        return userService.getUsers();
    }, function() {
        $scope.updateUsers();
    });

    $scope.users = {};


    $scope.updateUsers = ()=>{
        $scope.users = userService.getUsers();
    };


    $scope.openInq = (ID)=>{
        // window.open("http://localhost:3000/#!/home/inbox/chat/"+ID);
        window.open( location.origin+ "/#!/home/inbox/chat/"+ID);
    }

    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.orders = [];

        if(Object.keys($scope.allInq).length>0){
            // console.log($scope.allInq['-Kjs3Aj_BfMqilAUcgpc'].inquiryID);
            // console.log( $scope.allInq);
            for(k in $scope.allInq){
                // console.log($scope.allInq[k].quotations != undefined);
                // console.log($scope.users[$scope.allInq[k].inquiryOwner]!=undefined);
                // console.log("           ");

                if($scope.allInq[k].quotations != undefined && $scope.users[$scope.allInq[k].inquiryOwner]!=undefined){
                    // console.log("very true");
                    for(var i =0; i< $scope.allInq[k].quotations.length; i++){
                        if($scope.allInq[k].quotations[i].confirmation!=undefined)
                        {

                            $scope.toAdd = $scope.allInq[k].quotations[i].confirmation;
                            $scope.toAdd.time = $scope.allInq[k].quotations[i].confirmation.time;

                            // console.log(new Date($scope.allInq[k].quotations[i].payment.paymentDate));
                            $scope.toAdd.inquiryID = $scope.allInq[k].inquiryID;
                            $scope.toAdd.inquiryName = $scope.allInq[k].inquiryName;
                            $scope.toAdd.quote = $scope.allInq[k].quotations[i];
                            $scope.toAdd.quoteNumber = i + 1;
                            $scope.toAdd.customerID = $scope.allInq[k].inquiryOwner;

                            $scope.toAdd.gTotal = ($scope.allInq[k].quotations[i].gTotal).toFixed(2);
                            $scope.toAdd.customer = $scope.users[$scope.allInq[k].inquiryOwner].name;
                            $scope.toAdd.address = $scope.users[$scope.allInq[k].inquiryOwner].address;
                            $scope.toAdd.contact = $scope.users[$scope.allInq[k].inquiryOwner].contact
                            $scope.toAdd.email = $scope.users[$scope.allInq[k].inquiryOwner].email
                            $scope.toAdd.comname = $scope.users[$scope.allInq[k].inquiryOwner].comname



                            $scope.orders.push($scope.toAdd);
                        }
                    }
                }

            }

            // console.log($scope.payments);
        }
    };

});

app.controller("chatCtrl",($scope, $log,$stateParams, messageService,$state,inqService,userService,)=>{

    // console.log(firebase.apps.length);

    fbApp.auth().onAuthStateChanged(function(user) {
        if (!user){
            console.log("not logged in");
            window.location.href = location.origin+ "/#!/login";
        }

    });

    $scope.file_changed = function(element) {
        $scope.$apply(function(scope) {
            var imgRef = defaultStorage.child('photos'+ '/'+$stateParams.id+'/'+element.files[0].name);

            // mountainImagesRef.put(element.files[0]).then((snapshot)=>{
            // console.log('uploaded');
            // })

            var fileReader = new FileReader();
            fileReader.onload = ()=>{
                $scope.loadedFile = fileReader.result;
                   $scope.$apply();
            };

            fileReader.readAsDataURL(element.files[0]);


            $('#imgModal').modal('show');

            var files = element.files; //FileList object


            $scope.upload = ()=>{
                $('#imgModal').modal('hide');

                var uploadTask = imgRef.put(element.files[0]);
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,function(snapshot) {

                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    $scope.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // console.log('Upload is ' + progress + '% done');
                }, function(error) {

                    alert("error uploading, please try again")
                }, function() {
                    // Upload completed successfully, now we can get the download URL
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    // console.log(downloadURL);

                    socket.emit("sendImage", downloadURL,$stateParams.id);

                });
            }

        });
    };


    $scope.getRead = (inq)=>{
        // console.log(inq.lastMessage);
        if(inq.lastMessage.messageUser=="admin")
        {
            return true;
        }else if(inq.lastMessage.messageUser!="admin" && inq.lastMessage.messageRead== true){
            return true;
        }
        else{
          return false;
        }
    };

    $scope.getUnread = (inq)=>{
        if(inq.lastMessage.messageUser=="admin"){
            return false;
        } else if(inq.lastMessage.messageUser!="admin" && inq.lastMessage.messageRead== false){
            return true;
        }else if(inq.lastMessage.messageUser!="admin" && inq.lastMessage.messageRead== true){
            return false;
        }
    };

    $scope.getPaid = (inq)=>{
        if('quotations' in inq)
        {
            for(var i = 0; i < inq.quotations.length; i++)
            {
                // console.log(inq.quotations[i]);
                if('payment' in inq.quotations[i]){
                    return true;
                }
            }

            return false;
        }
    }

    $scope.getInbox = (inq)=>{ // filtering
        if(inq.status=="trash")
        {
            return false;
        }

        return true;
    }

    $scope.getTrash = (inq)=>{ // filtering
        if(inq.status=="trash")
        {
            return true;
        }

        return false;
    }

    $scope.getUnpaid = (inq)=>{
        if('quotations' in inq)
        {
            for(var i = 0; i < inq.quotations.length; i++)
            {
                // console.log(inq.quotations[i]);
                if('payment' in inq.quotations[i]){
                    return false;
                }
            }

            return true;
        }
        else{
            return true;
        }

    }

    $scope.selected = "inbox";


    $scope.view = ()=>{
        $('.image').viewer();
    };

    socket.emit("retrieveInfo");

    socket.on("redirectToLogin1",()=>{


        $state.go('login');
        window.location.reload();
    });

    $scope.logout = ()=>{
        fbApp.auth().signOut();
    };

    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
    $scope.allInquiryList = [];

    $scope.messages = [];

    $scope.users = [];

    $scope.hideName = true;
    $scope.hideRoom = false;

    socket.on("loadMessage",(msg)=>{
        var message = msg;
        messageService.addMessage(message);
        $scope.$apply();

    });


    socket.on("recieveMessage",(msg)=>{

        var message = {};
        var message = msg;

        $scope.notificationtitle = $scope.allInquiryList[msg.inquiryID].inquiryName;

        messageService.addMessage(message);
        $scope.$apply();

        $scope.updateInq();


        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });

        // console.log(message);
        var notification;


        if(message.messageUser!= 'admin'){
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {

                // console.log(notification);
                if(notification){

                }else{
                    // console.log("dont have")

                    notification = new Notification($scope.notificationtitle, {
                        icon: 'http://s-yoolk-images.s3.amazonaws.com/my/logo_images/large/2753548-386885_454802397874670_288420056_n_-_Copy?1480673320',
                        body: message.messageText,
                    });

                    setTimeout(notification.close.bind(notification), 3000);
                }



                notification.close();


                if(message.messageType== "payment"){
                    notification.onclick = function () {
                        window.open(location.origin+ "/#!/home/history");
                        // window.open("http://localhost/#!/home/inbox/chat/"+ID);
                    };
                }else{
                    notification.onclick = function () {
                        window.open(location.origin+ "/#!/home/inbox/chat/"+msg.inquiryID.trim());
                        // window.open("http://localhost/#!/home/inbox/chat/"+ID);
                    };
                }

            }
        }

    });

    socket.on("updateUserList",(userList)=>{
        $scope.users = userList;
        userService.addUsers(userList);
        $scope.$apply();

        $scope.updateInq();

    });

    $scope.updateInq = ()=>{
        $scope.messages= messageService.getMessage();
        // console.log($scope.messages);

        $scope.allInquiryList = inqService.getInq();
        angular.forEach($scope.allInquiryList, function(item,key){
            var itemNames = '';
            var tMessages = '';

            // for(var i = 0; i < item.items.length;i++){
            //     if(item.items[i].extraComment!='')
            //     {
            //         itemNames = itemNames + " "+ item.items[i].extraComment;
            //     }
            // }
            // item.itemNames = itemNames;

            if($scope.users[item.inquiryOwner].name)
            {
                item.customer = $scope.users[item.inquiryOwner].name;
            }
            else{
                item.customer = "no name";
            }

            for(var j=0;j<$scope.messages.length;j++){
                if($scope.messages[j].inquiryOwner == item.inquiryOwner){
                    tMessages = tMessages  + " "+  $scope.messages[j].messageText;
                }
            }

            item.messages = tMessages;
        });
        // console.log($scope.allInquiryList);
    };

    socket.on("updateInquiryList",(inquiryList)=>{
        inqService.addInq(inquiryList);
        $scope.$apply();

        $scope.updateInq();
    });


    $scope.updateRead = (inq)=>{
        socket.emit("updateLastRead",inq);
    };


});

app.controller("chatBoxCtrl",($scope,$stateParams,messageService,inqService,userService)=>{

    var rT = 0;
    $scope.discount = false;

    $scope.toggleDiscount = ()=>{
        if($scope.discount){
            $scope.dis=0;
            $scope.discount = false;
            $scope.getTotal();

        }
        else{
            $scope.dis=0;
            $scope.discount = true;
            $scope.getTotal();

        }
    };

    $("#usermsg").keypress(function (e) {
        if(e.which == 13 && !e.shiftKey) {
            $scope.sendMessage2();
            e.preventDefault();
            return false;
        }
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })

    $scope.chatID = $stateParams.id; //get chat id
    $scope.messages = messageService.getMessage(); //get messages

    $scope.all = {};

    // $scope.allInq = inqService.getInq();

    $scope.$watch(function() {
        return userService.getUsers();
    }, function() {
        $scope.updateUsers();
    });

    $scope.users = {};

    $scope.toTrash = (inq)=>{
        socket.emit("toTrash",inq);

    }

    $scope.toInbox = (inq)=>{
        socket.emit("toInbox",inq);

    }

    $scope.updateUsers = ()=>{
        $scope.users = userService.getUsers();
    };


    $scope.$watch(function() {
        return inqService.getInq();
    }, function(newContacts) {

        $scope.getInq();
    });

    $scope.currentInq = {};
    $scope.item1= [];
    $scope.allInq = {};


    $scope.addRow = ()=>{
        $scope.currentInq1.items.push({});

        $scope.item1.push('');
    };

    $scope.removeRow= (index)=>{
        if(index>-1)
        {
            $scope.currentInq1.items.splice(index,1);
            $scope.ppu.splice(index,1);
            $scope.quantity.splice(index,1);
            // $scope.total.splice(index,1);

            $scope.bearing.splice(index,1);

            // console.log($scope.total);
            $scope.getTotal();
        }
    };



    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.currentInq = angular.copy($scope.allInq[$scope.chatID]);


        $scope.currentInq1 = angular.copy($scope.currentInq);



        if($scope.currentInq!=undefined)
        {
            for(var i=0;i<$scope.currentInq['items'].length;i++ ){
                $scope.item1.push($scope.currentInq['items'][i].serialNo);
            }
            // console.log($scope.users);
            $scope.currentUser = $scope.users[$scope.currentInq.inquiryOwner];
            // console.log($scope.currentUser);
        }




    };


    $scope.updateBearings = (index,serial)=>{
        $scope.item1[index] = serial;
    };

    $scope.ppu = [];
    $scope.quantity = [];
    $scope.total = [];
    $scope.bearing= [];
    $scope.gTotal = 0;

    $scope.getTotal = ()=>{

        var l = $scope.ppu.length;

        var total = 0;
        for(var i =0; i<l; i++)
        {
            total = total + ($scope.ppu[i] * $scope.quantity[i]);
        }
        // console.log("total is" + total);

        $scope.realTotal = total;
        rT = total;

        if($scope.discount && $scope.realTotal != 0){

            // $scope.$apply();
            // console.log("total " + total);

            // console.log($scope.dis);
            // console.log($scope.realTotal* $scope.dis/100 );


            total = total - ($scope.realTotal* $scope.dis/100) ;

        }

        $scope.gTotal = total;
    };


    $scope.sendQuote = ()=>{
        $scope.data = [];
        // console.log($scope.ppu);

        for(var i = 0; i < $scope.ppu.length;i++){
            var serial = $scope.item1[i];
            var q = $scope.quantity[i];
            var ppu = $scope.ppu[i];
            var t = $scope.total[i];

            var c = {};
            c['serialNo']= serial;
            c['quantity'] = q;
            c['pricePerUnit'] = ppu;
            c['total'] = q * ppu;

            $scope.data.push(c);
            // console.log(c);
        }

        $scope.tosend = {};
        $scope.tosend.quoteBearings = $scope.data;

        $scope.tosend.discountAmount = $scope.realTotal* $scope.dis/100;
        $scope.tosend.discountPercent = $scope.dis;

        $scope.tosend.discountPercent = parseFloat($scope.tosend.discountPercent);

        $scope.tosend.rTotal = rT;
        $scope.tosend.gTotal = $scope.gTotal;

        $scope.tosend.userStatus = "";
        $scope.tosend.time = parseInt(new Date().getTime());

        // console.log($scope.tosend);


        socket.emit("sendQuote",$scope.tosend,$scope.currentInq);

        var toSend = {};
        toSend.dest = $scope.chatID;
        toSend.mess = "I have sent you a Quotation";
        socket.emit("sendMessage",toSend,$scope.currentInq.inquiryOwner);
    };




    $scope.updateFilter = ()=>{
        $scope.filterR = {'inquiryID': $stateParams.id};
        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });
    };


    $scope.sendMessage2 = ()=>{
        if($scope.inputMessage!=''){
            var toSend = {};
            // console.log($scope.inputMessage);
            toSend.dest = $scope.chatID;
            toSend.mess = $scope.inputMessage;
            socket.emit("sendMessage",toSend,$scope.currentInq.inquiryOwner);
            $scope.inputMessage = '';
        }
    };

    $scope.autojoinRoom = ()=>{
        socket.emit("joinRoom",$scope.chatID);
    };

    $scope.updateRead = ()=>{
        socket.emit("updateLastRead2",$scope.chatID);
        // console.log('chatboxctrl');
    };

});

app.filter('customFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            if (item.inquiryID === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
});

app.filter('inqFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            // console.log(id);
            // console.log(item.inquiryOwner.length);
            if (item.inquiryOwner === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
});

app.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])

app.filter('reverse', function() {
  return function(items) {
      if(items){
          return items.slice().reverse();
      }
  };
});


app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
        if(a!=undefined && b!=undefined)
        {
            return (a.lastMessage.messageTime > b.lastMessage.messageTime ? 1 : -1);
        }
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});

app.config(function($stateProvider,$urlRouterProvider) {
//  $urlRouterProvider.otherwise('/home');
$urlRouterProvider.otherwise('home/inbox');
  $stateProvider
    .state('home',{
        url:"/home",
        abstract: true,
        templateUrl: "templates/home.html"
    })
    .state('home.admin',{
      url:"/admin",
      templateUrl: "templates/admin.html"
    })
    //
    // .state('admin.create',{
    //   url:"/admin/create",
    //   templateUrl: "templates/adminCreate.html"
    // })
    //
    // .state('admin.info',{
    //   url:"/admin/info",
    //   templateUrl: "templates/info.html"
    // })
    //
    .state('home.history',{
      url: '/history',
      templateUrl: "templates/history.html"
    })
    .state('home.inbox',{
      url: '/inbox',
      templateUrl: "templates/inbox.html"
    })
    .state('home.inbox.chat',{
      url: '/chat/:id',
      templateUrl: "templates/chats.html"
    })
    .state('login',{
        url:'/login',
        templateUrl:"templates/login1.html"
    })
    .state('home.stats',{
        url:'/stats',
        templateUrl: "templates/stats.html"
    })
    // .state('/', {
    //     url: '/',
    //     templateUrl: "templates/home.html"
    //
    // })
    ;
})


app.service('inqService', function() {
    var inqList = [];

    var addInq = function(newObj) {
    //   inqList.push(newObj);
        inqList = newObj;
        // console.log(inqList);
    };

    var getInq = function(){
      return inqList;
    };

    return {
        addInq: addInq,
        getInq: getInq
    };

});

app.service('userService', function() {
    var userList = [];

    var addUsers = function(newObj) {
    //   inqList.push(newObj);
        userList = newObj;
    };

    var getUsers = function(){
      return userList;
    };

    return {
        addUsers: addUsers,
        getUsers: getUsers
    };

});

app.service('messageService',function() {

    var messageConvo = [];
    var addMessage = function(newObj){
      messageConvo.push(newObj);
    };

    var getMessage = function(){
        return messageConvo;
    };

    return {
        addMessage: addMessage,
        getMessage: getMessage
    };
});
