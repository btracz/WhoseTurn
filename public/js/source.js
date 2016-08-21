var avatarFormData = new FormData();

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

$('.userThumbnail').miniPreview({
    height: 200,
    width: 200,
    scale: .50,
    prefetch: 'parenthover'
});

var avatarDialog = $("#dialog-avatar-form").dialog({
    autoOpen: false,
    height: 200,
    width: 300,
    modal: true,
    buttons: [{
        id: "uploadAvatarButton",
        disabled: true,
        text: "Ajouter l'image",
        click: function () {
            $("body").css("cursor", "wait");
            avatarUploadButtonsActive(false);
            $.ajax({
                url: '/admin/avatar/' + avatarDialog.data('login'),
                type: 'POST',
                data: avatarFormData,
                processData: false,
                contentType: false,
                success: function (data) {
                    console.log('upload successful!\n' + data);
                }
            }).then(function () {
                $("body").css("cursor", "default");
                avatarDialog.dialog("close");
                location.reload();
            }).error(function () {
                $("body").css("cursor", "default");
                avatarUploadButtonsActive(true);
                alert('Erreur, veuillez réessayer.');
            });
        }
    },
        {
            text: "Annuler",
            click: function () {
                $('#avatarFile').val('');
                avatarDialog.dialog("close");
            }
        }
    ],
    close: function () {
        $('#avatarFile').val('');
    }
});

function avatarUploadButtonsActive(active) {
    // Get the dialog buttons.
    var dialogButtons = $("#dialog-avatar-form").dialog("option", "buttons");

    // Find and disable the "Done" button.
    $.each(dialogButtons, function (buttonIndex, button) {
        button.disabled = !active;
    });

    // Update the dialog buttons.
    $("#dialog-avatar-form").dialog("option", "buttons", dialogButtons);
}

$(".avatarChangeButton").button().on("click", function () {
    avatarDialog.data('login', this.parentNode.parentNode.id.replace('Row', ''));
    avatarDialog.dialog("open");
});

$('#avatarFile').on('change', function (e) {
    var files = $(this)[0].files;

    if (files.length > 0) {
        var avatar = files[0];
        // add the files to formData object for the data payload
        avatarFormData.append('avatar', avatar, avatar.name);
    }

    $("#uploadAvatarButton").attr("disabled", false);
});

$(".userEditButton").button().on("click", function () {
    var login = this.parentNode.parentNode.id.replace('Row', '');
    $('tr[id="' + login + 'Row"]').hide();
    $('tr[id="' + login + 'Form"]').show();
});

$(".userEditCancelButton").button().on("click", function () {
    var login = this.parentNode.parentNode.id.replace('Form', '');
    $('tr[id="' + login + 'Form"]').hide();
    $('tr[id="' + login + 'Row"]').show();
});

$(".userEditSaveButton").button().on("click", function () {
    var login = this.parentNode.parentNode.id.replace('Form', '');
    var url = "/admin/user";
    var data = {
        "id": login,
        "name": $('tr[id="' + login + 'Form"] input[id="name"]').val(),
        "hasSubscribe": $('tr[id="' + login + 'Form"] input[id="hasSubscribe"]').prop('checked'),
        "isExternal": $('tr[id="' + login + 'Form"] input[id="isExternal"]').prop('checked')
    };
    $.ajax({
        contentType: "application/json",
        type: "PUT",
        url: url,
        data: JSON.stringify(data),
        success: function (data) {
            location.reload();
        },
        error: function (err) {
            alert("Erreur, veuillez réessayer \n" + JSON.stringify(err));
            location.reload();
        }
    });
});