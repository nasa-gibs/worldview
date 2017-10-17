var wv = wv || {};
wv.feedback = wv.feedback || (function() {

  var self = {};
  var feedbackInit = false;

  self.decorate = function($element) {
    $element.attr("href",
      "mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool");

    $element.click(function(event) {
      if (!wv.util.browser.small && window.feedback) {
        event.preventDefault();
        if (!feedbackInit) {
          feedback.init({
            showIcon: false
          });
        }
        feedback.showForm();
        feedbackInit = true;
      }
    });
  };

  return self;

})();
