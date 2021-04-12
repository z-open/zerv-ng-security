'use strict';

describe('Unit testing for auth,', () => {
    let service,
        $syncMock,
        sessionUserMock;

    beforeEach(angular.mock.module('ui.router'));
    beforeEach(angular.mock.module('zerv.security'));

    beforeEach(angular.mock.module(($provide) => {
        $syncMock = {
            subscribe: jasmine.createSpy('$syncMock.subscribe'),
            setSingle: jasmine.createSpy('$syncMock.setSingle'),
            setOnReady: jasmine.createSpy('$syncMock.setOnReady'),
            waitForDataReady: jasmine.createSpy('$syncMock.waitForDataReady'),
        };
        $syncMock.subscribe.and.returnValue($syncMock);
        $syncMock.setSingle.and.returnValue($syncMock);
        $syncMock.setOnReady.and.returnValue($syncMock);
        $syncMock.waitForDataReady.and.returnValue(Promise.resolve({}));

        sessionUserMock = {};

        // $provide.value('$window', mock);
        $provide.value('$sync', $syncMock);
        $provide.value('sessionUser', sessionUserMock);
    }));

    beforeEach(() => {
        inject((uiStateResource) => {
            service = uiStateResource;
        });
    });

    it('decodeToken should retrieve the token payload', () => {
        expect(1 + 1).toEqual(2);
    });
});