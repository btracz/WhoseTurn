$(window).load(function () {
    $('.carousel').carousel('pause');
});

$("#parametersForm button[type=button]").click(function () {
    var url = "/admin/parameters";
    var data = {
        "mailServer": {
            "host": $("#host").val(),
            "port": $("#port").val(),
            "secure": $("#secure").prop('checked'),
            "requireTLS": $("#tls").prop('checked'),
            "auth": {
                "user": $("#user").val(),
                "pass": $("#pass").val()
            }
        },
        "mailSender": $("#sender").val(),
        "weeklyNotificationPattern": $('#cron').cron("value")
    };
    $.ajax({
        contentType: "application/json",
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        success: function (data) {
            console.log(data);
        },
        error: function (err) {
            console.log(err);
        }
    });
});

$("#addUserButton").click(function () {
    var url = "/admin/user";
    var newUserId = $("#newUserId").val();
    var newUserName = $("#newUserName").val();
    if (newUserId && newUserId.length > 0 &&
        newUserName && newUserName.length > 0) {
        var data = {
            "id": newUserId.toLowerCase(),
            "name": newUserName,
            "hasSubscribe": $("#newUserHasSubscribe").is(':checked'),
            "isExternal": $("#newUserIsExternal").is(':checked')
        };
        $.ajax({
            contentType: "application/json",
            type: "POST",
            url: url,
            data: JSON.stringify(data),
            success: function (response) {
                console.log(response);
                $("#newUserId").val('');
                $("#newUserName").val('');
                $("#newUserHasSubscribe").attr('checked', false);
                $("#newUserIsExternal").attr('checked', false);
                location.reload();
            },
            error: function (err) {
                alert('Echec : ' + JSON.stringify(err));
                console.log(err);
            }
        });
    } else {
        alert('Identifiant et Nom obligatoires');
    }
});