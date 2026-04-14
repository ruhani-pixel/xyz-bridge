/**
 * Solid Models Chat Widget v1.0
 * Embeddable script for any website
 */
(function () {
  'use strict';

  var config = {};
  var isOpen = false;
  var tenantId = '';

  function init(userConfig) {
    config = userConfig || {};
    tenantId = config.tenantId || '';
    if (!tenantId) return console.warn('[Solid Models Widget] tenantId is required');

    var color = config.color || '#C5A059';
    var position = config.position || 'bottom-right';
    var greeting = config.greeting || 'Hi! How can we help you today? 👋';
    var buttonText = config.buttonText || 'Chat with us';
    var origin = document.currentScript ? new URL(document.currentScript.src).origin : '';

    // Inject styles
    var style = document.createElement('style');
    style.textContent = '\n      #sm-widget-container { position: fixed; ' + (position === 'bottom-right' ? 'right: 24px;' : 'left: 24px;') + ' bottom: 24px; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }\n      #sm-widget-btn { background: ' + color + '; color: #fff; border: none; width: 62px; height: 62px; border-radius: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(197, 160, 89, 0.4); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); animation: smPulse 2s infinite; rotate: 4deg; }\n      #sm-widget-btn:hover { transform: scale(1.1) rotate(0deg); box-shadow: 0 15px 45px rgba(197, 160, 89, 0.6); }\n      #sm-widget-iframe { width: 390px; height: 620px; border: none; border-radius: 28px; box-shadow: 0 25px 80px rgba(0,0,0,0.3); display: none; margin-bottom: 16px; background: white; overflow: hidden; transform-origin: bottom right; }\n      #sm-widget-iframe.open { display: block; animation: smSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }\n      @keyframes smSlideIn { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }\n      @keyframes smPulse { 0% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0.6); } 70% { box-shadow: 0 0 0 15px rgba(197, 160, 89, 0); } 100% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0); } }\n    ';
    document.head.appendChild(style);

    // Widget container
    var container = document.createElement('div');
    container.id = 'sm-widget-container';

    // Iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'sm-widget-iframe';
    iframe.src = origin + '/widget-chat?tenantId=' + encodeURIComponent(tenantId) + '&color=' + encodeURIComponent(color) + '&greeting=' + encodeURIComponent(greeting);
    iframe.title = 'Chat Widget';

    // Button
    var btn = document.createElement('button');
    btn.id = 'sm-widget-btn';
    btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
    btn.onclick = function () {
      isOpen = !isOpen;
      iframe.className = isOpen ? 'open' : '';
      btn.style.rotate = isOpen ? '0deg' : '4deg';
    };

    container.appendChild(iframe);
    container.appendChild(btn);
    document.body.appendChild(container);
  }

  // Public API
  window['SolidModelsWidget'] = window['smw'] = function (cmd) {
    if (cmd === 'init') init(arguments[1]);
  };
  if (window['smw'] && window['smw'].q) {
    window['smw'].q.forEach(function (args) { window['smw'].apply(null, args); });
  }
})();
