function getSpec() {
  var spec = {
    url: $('#url').val(),
    title: $('#title').val(),
    email: $('#email').val(),
    item_selector: $('#item-selector').val(),
    target_selector: $('#target-selector').val(),
    title_selector: $('#title-selector').val(),
    image_selector: $('#image-selector').val(),
    content_selector: $('#content-selector').val(),
    author_selector: $('#author-selector').val(),
  };

  return spec;
}

function updatePreview() {
  var spec = getSpec();

  if (spec.url) {
    $.get('/preview', spec, function(data) {
      $('.preview').html(data);
    });
  }
}

$('#sample').on('change', function() {
  var sample = $(this).val();

  for (var attr in samples[sample]) {
    $('#' + attr.replace('_', '-')).val(samples[sample][attr]);
  }
  updatePreview();
});

$('.btn-publish').on('click', function() {
  var spec = getSpec();

  if (spec.url) {
    $.post('/publish', spec, function(data) {
      $('#modal .modal-dialog').html(data.modal);
      $('#modal').modal();
    });
  }
});

$(document).on('click', '.btn-update-preview', function(e) {
  e.preventDefault();
  updatePreview();
});

$(document).ready(function() {
  updatePreview();
});
