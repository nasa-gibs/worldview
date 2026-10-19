import onClickFeedback from './util';

describe('onClickFeedback', () => {
  it('should call feedback.init and feedback.showForm if not initiated and feedback is defined', () => {
    window.feedback = {
      init: jest.fn(),
      showForm: jest.fn(),
    };
    onClickFeedback(false, false);
    expect(window.feedback.init).toHaveBeenCalledWith({
      showIcon: false,
    });
    expect(window.feedback.showForm).toHaveBeenCalled();
  });

  it('should call feedback.showForm if already initiated and feedback is defined', () => {
    window.feedback = {
      init: jest.fn(),
      showForm: jest.fn(),
    };
    onClickFeedback(true, false);
    expect(window.feedback.init).not.toHaveBeenCalled();
    expect(window.feedback.showForm).toHaveBeenCalled();
  });

  it('should not call feedback methods if feedback is not defined', () => {
    delete window.feedback;
    onClickFeedback(false, false);
  });
});
