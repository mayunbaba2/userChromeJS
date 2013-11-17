// ==UserScript==
// @description  Tab Plus 标签页增强
// @include      chrome://browser/content/browser.xul
// ==/UserScript==

 /* Open Bookmarks/History/Homepage/URL/Search in New Tab */
//地址栏、搜索栏、书签菜单、书签工具栏、历史菜单、主页按钮

(function() {
    /*open bookmark/history in new tab */
    try {
        eval("whereToOpenLink = " + whereToOpenLink.toString().replace(
            /var shift/,"var Class=e.target.getAttribute('class'); try "
            +"{ if (Class=='') Class=e.target.parentNode.getAttribute('"
            +"class');} catch(e) {} Browser=getTopWin().document.getEle"
            +"mentById('content'); if ((!IsBlankPage(Browser.currentURI"
            +".spec)|| Browser.webProgress.isLoadingDocument) && Class "
            +"&& (Class=='sidebar-placesTreechildren'||Class=='placesTr"
            +"ee'||Class.indexOf('bookmark-item')>=0)) return 'tab'; $&"
            ));
    }catch(e){}

    /*open url in new tab */
    try {
        try { // firefox 3.0.*
            eval("BrowserLoadURL = "+ BrowserLoadURL.toString().replace(
                /if \(aTriggeringEvent instanceof MouseEvent\) {/,
                "_LoadURL(aTriggeringEvent, aPostData); return; $&"));
        }
        catch(e) { // firefox 3.1+
            var urlbar = document.getElementById("urlbar");
            eval("urlbar.handleCommand="+ urlbar.handleCommand.toString(
                ).replace("aTriggeringEvent.altKey && ", "").replace(
                "altEnter && !isTabEmpty","!isMouseEvent && !isTabEmpty"
                ));
        }
    }catch(e){}

    /*open home in new tab */
    try {
        eval("BrowserGoHome = " + BrowserGoHome.toString().replace(
            /switch \(where\) {/, "where = (gBrowser.currentURI.spec!="
            +"'about:blank' || gBrowser.webProgress.isLoadingDocument"+
            ") ? 'tab' : 'current'; $&")); 
    }catch(e){}

    /*open search in new tab */
    try {
        var searchbar = document.getElementById("searchbar");
        eval("searchbar.handleSearchCommand="+searchbar.handleSearchCommand.
            toString().replace(/this.doSearch\(textValue, where\);/,
            "if (!gBrowser.webProgress.isLoadingDocument && gBrowser.curren"
            +"tURI.spec=='about:blank') where='current'; else where='tab'; "
            +"$&"));
    }catch(e){}

})();

function _LoadURL(aTriggeringEvent, aPostData)
{
    var where = (gBrowser.currentURI.spec!='about:blank' ||
        gBrowser.webProgress.isLoadingDocument) ? 'tab' :
        'current';
    if (gURLBar.value!='') openUILinkIn(gURLBar.value, where);
    return true;
}

function IsBlankPage(url)
{
    return url=="" || url=="about:blank" || url=="about:home"
        || url=="about:newtab";
}

//总在当前标签页打开Bookmarklet
eval("openLinkIn = " + openLinkIn.toString()
  .replace(/(?=if \(where == "save"\))/, 'if (url.substr(0, 11) == "javascript:") where = "current";')
  .replace(/(?=var loadInBackground)/, 'if (w.gBrowser.currentURI.spec == "about:blank" && !w.gBrowser.mCurrentTab.hasAttribute("busy")) where = "current";')
);

//书签、历史侧边栏
document.getElementById("sidebar-box").addEventListener("load", function(event) {
  var document = event.target;
  if (document.location == "chrome://browser/content/bookmarks/bookmarksPanel.xul"
      || document.location == "chrome://browser/content/history/history-panel.xul") {
    eval("document.defaultView.whereToOpenLink = " + document.defaultView.whereToOpenLink.toString()
      .replace(/return "current";/g, 'return "tab";')
    );
    eval("document.defaultView.openLinkIn = " + document.defaultView.openLinkIn.toString()
      .replace(/(?=if \(where == "save"\))/, 'if (url.substr(0, 11) == "javascript:") where = "current";')
      .replace(/(?=var loadInBackground)/, 'if (w.gBrowser.currentURI.spec == "about:blank" && !w.gBrowser.mCurrentTab.hasAttribute("busy")) where = "current";')
    );
  }
}, true);

//地址栏回车键在新标签页打开，Alt+回车键在当前标签页打开
eval("gURLBar.handleCommand = " + gURLBar.handleCommand.toString()
  .replace(/aTriggeringEvent\s*&&\s*aTriggeringEvent.altKey/, "!($&)")
  .replace("aTriggeringEvent.preventDefault();", "")
  .replace("aTriggeringEvent.stopPropagation();", "")
);

	// 标签上双击刷新
gBrowser.mTabContainer.addEventListener('dblclick', function (event){
if (event.target.localName == 'tab' && event.button == 0){
getBrowser().getBrowserForTab(event.target).reload();
}
}, false);



//紧邻当前标签新建标签页
(function() {
    try {
        if(!gBrowser) return;
    }catch(e) {
        return;
    }
    
    gBrowser.tabContainer.addEventListener("TabOpen", tabOpenHandler, false);

    function tabOpenHandler(event) {
        var tab = event.target;
        gBrowser.moveTabTo(tab, gBrowser.mCurrentTab._tPos + 1);
    }

})();

//标签页关闭后激活右侧标签页
(function() {
  if ("TM_init" in window || "tabutils" in window) return;

  //关闭标签页时选择左侧/右侧/第一个/最后一个/最后打开的标签
  hookCode("gBrowser.removeTab", "{", "aTab.setAttribute('removing', true);");
  gBrowser.blurTab = function(aTab) {
    if (!aTab)
      aTab = this.mCurrentTab;
    else if (aTab != this.mCurrentTab)
      return;

    if (getPref('browser.tabs.selectOwnerOnClose') && aTab.owner && !aTab.owner.hasAttribute('removing')) {
      this.selectedTab = aTab.owner;
      return;
    }

    var mode = getPref('userChromeJS.openNewTabLite.selectOnClose', 1);
    switch (mode) {
      case 1: //right
        var tab = aTab.previousSibling;
        while (tab) {
          if (!tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          tab = tab.previousSibling;
        }
        var tab = aTab.nextSibling;
        while (tab) {
          if (!tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          tab = tab.nextSibling;
        }
        break;
      case 2: //First
        var tab = this.mTabContainer.firstChild;
        while (tab) {
          if (!tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          tab = tab.nextSibling;
        }
        break;
      case 3: //Last
        var tab = this.mTabContainer.lastChild;
        while (tab) {
          if (!tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          tab = tab.previousSibling;
        }
        break;
      case 4: //Last Opened
        var panel = this.mPanelContainer.lastChild;
        while (panel) {
          var tab = document.getAnonymousElementByAttribute(this, "linkedpanel", panel.id);
          if (tab && !tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          panel = panel.previousSibling;
        }
        break;
      case 0: //left
      default:
        var tab = aTab.nextSibling;
        while (tab) {
          if (!tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          tab = tab.nextSibling;
        }
        var tab = aTab.previousSibling;
        while (tab) {
          if (!tab.hasAttribute('removing')) {
            this.selectedTab = tab;
            return;
          }
          tab = tab.previousSibling;
        }
        break;
    }
  }
})();
