$(window).load(function () {
    $('.carousel').carousel('pause');
});

$("#parametersForm button[type=button]").click(function (event) {
    var url = "/admin/parameters";
    var data = {
        mailServer: {
            host: $("#host").val(),
            port: $("#port").val(),
            secure: $("#secure").prop('checked'),
            requireTLS: $("#tls").prop('checked'),
            auth: {
                user: $("#user").val(),
                pass: $("#pass").val()
            }
        },
        weeklyNotificationPattern: $('#cron').cron("value")
    };
    console.log(data);
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType: "json",
        success: function (data) {
            console.log(data);
        }
    });
});