$('.deleteDelivererButton').button().on("click", function () {
    if(confirm("Etes-vous sûr ? (Attention, effet immédiat)")){
        var id = this.parentNode.id;
        $('li[id="' + id + '"]').remove();
        $('#sortable').append('<li class="ui-state-default"><span class="delivererName" id="' + $('#deliverer-id').val() + '"></span></li>');
        var planning = convertListToArray();
        $.ajax({
            contentType: "application/json",
            type: "POST",
            url: '/admin/planning/update',
            data: JSON.stringify(planning),
            success: function (data) {
                console.log(data);
                location.reload(true);
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
});

$(".changeDelivererButton").button().on("click", function () {
    var id = this.parentNode.id;
    $('li[id="' + id + '"] .delivererName').hide();
    $('li[id="' + id + '"] .deleteDelivererButton').hide();
    $('li[id="' + id + '"] .changeDelivererButton').hide();
    $('li[id="' + id + '"] .changeDelivererList').show();
    $('li[id="' + id + '"] .saveDelivererButton').show();
    $('li[id="' + id + '"] .cancelDelivererButton').show();
});

$(".cancelDelivererButton").button().on("click", function () {
    var id = this.parentNode.id;
    $('li[id="' + id + '"] .delivererName').show();
    $('li[id="' + id + '"] .deleteDelivererButton').show();
    $('li[id="' + id + '"] .changeDelivererButton').show();
    $('li[id="' + id + '"] .changeDelivererList').hide();
    $('li[id="' + id + '"] .saveDelivererButton').hide();
    $('li[id="' + id + '"] .cancelDelivererButton').hide();
});

$('#savePlanning').button().on("click", function () {
    var planning = convertListToArray();
    var planning = convertListToArray();
    $.ajax({
        contentType: "application/json",
        type: "POST",
        url: '/admin/planning/update',
        data: JSON.stringify(planning),
        success: function (data) {
            console.log(data);
            location.reload(true);
        },
        error: function (err) {
            console.log(err);
        }
    });
});

function convertListToArray() {
    var updatedPlanning = [];
    var dates = [];

    $('ul[id="dates"] li').each(function () {
        dates.push($(this).text().replace('\n', '').trim())
    });

    $('ul[id="sortable"] li').each(function (index, item) {
        updatedPlanning.push({
            "date": dates[index],
            "deliverer": $(item).children(".delivererName")[0].id
        })
    });

    return updatedPlanning;
}