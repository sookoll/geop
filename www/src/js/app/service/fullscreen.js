/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define, Element*/

define([
    'jquery'
], function ($) {
    
    'use strict';
    
    function FullScreen(el) {
        this._active = false;
        this._el = el;
        
        var test = this.test();
        
        if (test) {
            this._el.on('click', $.proxy(this.toggle, this));
            $(document).on(
                'webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange',
                $.proxy(this.toggleState, this)
            );
        }
    }
    
    FullScreen.prototype = {
        
        test : function () {
            if (
                document.fullscreenEnabled ||
                    document.webkitFullscreenEnabled ||
                    document.msFullscreenEnabled ||
                    document.mozFullScreenEnabled
            ) {
                this._el.removeClass('disabled');
                return true;
            }
            return false;
        },
        
        toggle : function (e) {
            e.preventDefault();
            if (!this._active) {
                this.on();
            } else {
                this.off();
            }
        },
        
        toggleState : function () {
            if (
                document.fullscreenElement ||
                    document.msFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.webkitFullscreenElement
            ) {
                this._active = true;
                this._el.addClass('active');
            } else {
                this._active = false;
                this._el.removeClass('active');
            }
        },
        
        on : function () {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        },
        
        off : function () {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    };

    return FullScreen;
    
});