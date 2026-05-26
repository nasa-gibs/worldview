import actions from './actions';

describe('InitFeedback actions', () => {
  it('Call initFeedback and return INITIATE _FEEDBACK_MODULE', () => {
    expect(actions()).toEqual({
      type: 'INITIATE_FEEDBACK_MODULE',
    });
  });
});
