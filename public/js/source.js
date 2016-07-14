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