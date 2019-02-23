describe('Timer', function() {
  /* globals Date: true */
  it('reports the time elapsed', function() {
    var fakeNow = jasmine.createSpy('fake Date.now'),
        timer = new jasmineUnderTest.Timer({now: fakeNow});

    fakeNow.and.returnValue(100);
    timer.start();

    fakeNow.and.returnValue(200);

    expect(timer.elapsed()).toEqual(100);
  });

  describe('when Date is clumsily stubbed, perhaps by other testing helpers', function() {
    // NetSuite libraries use Date, improperly stubbing Date will cause errors
    if (jasmine.getEnv().isNetSuite()) {
      return;
    }

    var origDate = Date;
    beforeEach(function() {
      Date = jasmine.createSpy('date spy');
    });

    afterEach(function() {
      Date = origDate;
    });

    it('does not throw even though Date was taken away', function() {
      var timer = new jasmineUnderTest.Timer();

      expect(timer.start).not.toThrow();
      expect(timer.elapsed()).toEqual(jasmine.any(Number));
    });
  });

  describe('when Date is carefully stubbed, perhaps by other testing helpers', function() {
    var origDate = Date;

    it('does not throw even though Date was taken away', function() {
      Date = jasmine.createSpy('date spy').and.callThrough();

      try {
        var timer = new jasmineUnderTest.Timer();

        expect(timer.start).not.toThrow();
        expect(timer.elapsed()).toEqual(jasmine.any(Number));
        expect(Date).not.toHaveBeenCalled();
      } finally {
        Date = origDate;
      }
    });
  });
});
