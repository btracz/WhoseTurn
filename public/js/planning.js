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