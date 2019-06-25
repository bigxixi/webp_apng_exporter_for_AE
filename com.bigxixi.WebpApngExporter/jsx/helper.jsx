
#include "../js/json2.js"

function updateLan(){
    var theLan = '';
    if (app.settings.haveSetting("BX_parameters", "language")){
        theLan = app.settings.getSetting("BX_parameters", "language");
    }else{
        theLan = $.locale.toLowerCase();
    }
    return theLan;
}

function getPath(path){
    var tempFile = new File(path)
    var theLocation = tempFile.saveDlg("选择文件保存地址");
    if(theLocation != null){
        return decodeURIComponent(theLocation.fsName);
    }else{
        return null;
    }
}

function getCurCompName(){
    return filterName(app.project.activeItem.name);
}

function getFrameCounts(){
    var temp =  Math.round(app.project.activeItem.workAreaDuration/app.project.activeItem.frameDuration);
    return temp;
}


function filterName(str){
    var pattern = new RegExp("[\"' ]");
    var specialStr = "";
    for(var i=0;i<str.length;i++){
        specialStr += str.substr(i, 1).replace(pattern, '_'); 
    }
    return specialStr;
}

function checkAccess(){
        //app.executeCommand(2359);
    return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY");
}

function checkSettings(v1,v2){
    if(app.settings.haveSetting(v1,v2)){
        return app.settings.getSetting(v1,v2);
    }else{
        return false;
    }
}

// function getSettings(v1,v2){
//     return app.settings.getSetting(v1,v2);
// }

function saveSettings(v1,v2,v3){
    app.settings.saveSetting(v1,v2,v3);
}

//save png via renderQ
//script by bigxixi
//if rendering...？
function savePNG(theComp,theLocation) {
    //if the resolution isnt 'Full', store current resolution and set to Full, then restore later;
    var res = [1,1];
    var start = theComp.workAreaStart;
    var dur = theComp.workAreaDuration;
    if(theComp.resolutionFactor != "1,1"){
        res = theComp.resolutionFactor;
        theComp.resolutionFactor = [1,1];
        }
    
    if(theLocation != null){
        //close the renderQueue panel
        app.project.renderQueue.showWindow(false);
        //show the correct charactar in the path
        theLocation = decodeURIComponent(theLocation);
        //backup the render queue status, then uncheck the queued items
        var RQbackup = storeRenderQueue();
        //check if renderQ rendering, if so,return "R".
        if(RQbackup[RQbackup.length-1] == "rendering"){
            //**an option is to render through 'saveFrameToPng()': **
            //alert("Render Queue is rendering item, now export the png using saveFrameToPng().");
            //theComp.saveFrameToPng(0, theLocation);
            //*******************************************************
            return "R";
        }else{
            //call command "save frame as" to add current frame to render queue
            theComp.openInViewer();
            app.executeCommand(2104);
            app.project.renderQueue.item(app.project.renderQueue.numItems).render = true;
            var templateTemp = app.project.renderQueue.item(app.project.renderQueue.numItems).outputModule(1).templates;
            //call hidden template '_HIDDEN X-Factor 16 Premul', which exports png with alpha
            var setPNG = app.project.renderQueue.item(app.project.renderQueue.numItems).outputModule(1).templates[templateTemp.length-1];
            app.project.renderQueue.item(app.project.renderQueue.numItems).outputModule(1).applyTemplate(setPNG);
            app.project.renderQueue.item(app.project.renderQueue.numItems).outputModule(1).file = new File(theLocation);

            var RednerSettings = {
                "Time Span Duration":dur,
                "Time Span Start":start
                };
            var OutputSettings = {
                "Use Comp Frame Number":false,
                "Starting #":"0"
                };

            app.project.renderQueue.item(app.project.renderQueue.numItems).setSettings(RednerSettings);
            app.project.renderQueue.item(app.project.renderQueue.numItems).outputModule(1).setSettings(OutputSettings);
            
            var finalpath = app.project.renderQueue.item(app.project.renderQueue.numItems).outputModule(1).file.fsName;

            app.project.renderQueue.render();
            //remove the rendered item and restored the render queue items
            app.project.renderQueue.item(app.project.renderQueue.numItems).remove();
            if(RQbackup != null){
                restoreRenderQueue(RQbackup);					
            }
            app.activeViewer.setActive();
            app.project.activeItem.resolutionFactor = res;
            return finalpath;
        }
    }
    //store the renderQ,return the index of active render items
    function storeRenderQueue(){
        var checkeds = [];
        for(var p = 1;p <= app.project.renderQueue.numItems; p++){
            if (app.project.renderQueue.item(p).status == RQItemStatus.RENDERING){
                checkeds.push("rendering");
                break;
            }else if(app.project.renderQueue.item(p).status == RQItemStatus.QUEUED){
                    checkeds.push(p);
                    app.project.renderQueue.item(p).render = false;
            }
        }
        return checkeds;
    }

    //restore the renderQ
    function restoreRenderQueue(checkedItems){
        for(var q = 0;q < checkedItems.length; q++){
            app.project.renderQueue.item(checkedItems[q]).render = true;
        }
    }
    
}

function savePNGsequence(lcs){
    var temp = savePNG(app.project.activeItem,lcs);
    return temp;
}

function newFolder(location){
    var tempFolder = new Folder(location);
        tempFolder.create();
}

function fileExist(path){
    var tempFile = new File(path);
    return tempFile.exists;
}

function genAssets(etloc,loc,loc2,appPath,type,q,l){
    var CMDvar="clear && printf '\\e[3J';echo '--------BX Webp/Apng Exporter--------';echo Processing, Please wait...;echo '动画导出中，请稍候。。。';echo '-------------------------------------';";
    var appPathObj=JSON.parse(appPath);
    var osSlash = "/";
    if($.os.toLowerCase().indexOf("mac") == 0){
        //osSlash = "/";
        var OSappPath = appPathObj.mac;
        var theLF = "Macintosh";
        var theEnc = "UTF-8";
        var CMDprefix = ".command";
    }else{
        osSlash = "\\";
        var OSappPath = appPathObj.win;
        var theLF = "windows";
        var theEnc = "GBK";
        var CMDprefix = ".bat";
    }

    var theName = loc.substring(loc.lastIndexOf(osSlash)+1,loc.lastIndexOf('.'));
    var pFolder = loc.substring(0,loc.lastIndexOf('.'));

    var ppFolder0 = loc.substring(0,loc.lastIndexOf(osSlash));
    var ppFolder1 = loc2.substring(0,loc2.lastIndexOf(osSlash));

    var tempFolder = new Folder(pFolder);
        tempFolder.create();
    if(ppFolder0 != ppFolder1){
        var temppFolder = new Folder(ppFolder1);
        temppFolder.create();
    }


    var tempPngPath = pFolder + osSlash + "temp.png";
    var compFPS = 1/app.project.activeItem.frameDuration;

    var tempPath = savePNG(app.project.activeItem,tempPngPath);

    var CMDpath = etloc.substring(0,etloc.lastIndexOf(osSlash)) + osSlash + "temp" + CMDprefix;

    var tempPNGs = tempFolder.getFiles("*.png");
    var fileCount = tempPNGs.length;

    for(var i=0;i<fileCount;i++){
        for(var j=0;j<fileCount;j++){
            if(tempPNGs[i].name < tempPNGs[j].name){
                var tempItem = tempPNGs[i];
                tempPNGs[i] = tempPNGs[j];
                tempPNGs[j] = tempItem;
            }
        }
    }
    var tempFileNames="";

    //判断目标文件夹是否存在
    for(var i=0;i<fileCount;i++){
        CMDvar += '"'+OSappPath[0]+'" "'+tempPNGs[i].fsName+'" --speed 1 --quality '+q+' -f --ext .png;';
        tempFileNames += tempPNGs[i].name+" ";
    }
    switch(type){
        case 1:
            CMDvar += 'cd "'+tempPNGs[0].parent.fsName+'";"'+OSappPath[2]+'" "'+loc2+'" '+tempFileNames+'1 '+compFPS+' -l'+l+';';
            CMDvar += '"'+OSappPath[1]+'"  -loop '+l+' -d '+1000*app.project.activeItem.frameDuration+' -lossy -q '+q+' '+tempFileNames+'-o "'+loc+'";';
            if($.os.toLowerCase().indexOf("mac") == 0){
                CMDvar += "rm -rf \"" + tempPNGs[0].parent.fsName + "\";"+
                            "rm \"" + CMDpath + "\";"+
                            "open \"" + ppFolder0 + "\";"+
                            "open \"" + ppFolder1 + "\";"+
                            "osascript -e 'tell application \"Terminal\" to close first window' & exit;";
                    var tempcmds = "chmod +x '" + CMDpath + "'";
                }else{
                    CMDvar ='@echo off\n'+
                        'setlocal enabledelayedexpansion\n'+
                        'set SrcFolder="'+pFolder+'"\n'+
                        'set DstFileApng="'+loc2+'"\n'+
                        'set DstFileWebp="'+loc+'"\n'+
                        'set apngasm="'+OSappPath[2]+'"\n'+
                        'set img2webp="'+OSappPath[1]+'"\n'+
                        'set pngq="'+OSappPath[0]+'"\n'+
                        '\n'+
                        'set /a loop = '+l+'\n'+
                        'set /a fps = '+compFPS+'\n'+
                        'set /a q = '+q+'\n'+
                        'set /a fDuraton = 1000/%fps%\n'+
                        '\n'+
                        'cd /d %SrcFolder%\n'+
                        'for /f "delims=" %%i in (\'"dir /a/s/b/on *.png*"\') do (  \n'+
                        '  echo %%i\n'+
                        '  %pngq% "%%~nxi" --speed 1 --quality %q% -f --ext .png\n'+
                        '  set "imgs=!imgs!"%%i" "\n'+
                        ') \n'+
                        'echo %imgs%\n'+
                        '\n'+
                        '%apngasm% %DstFileApng% %imgs% 1 %fps% -l%loop%\n'+
                        '%img2webp% -loop %loop% -lossy -q 100 -d %fDuraton% %imgs% -o %DstFileWebp%\n'+
                        '\n'+
                        'cd ..\n'+
                        'rd /s /Q %SrcFolder%\n'+
                        '\n';

                        CMDvar +='cd "'+ppFolder0+'"\n'+
                        'start .\n';

                        if(ppFolder0 != ppFolder1){
                            CMDvar +='cd "'+ppFolder1+'"\n'+
                            'start .\n';
                        }

                        CMDvar += 'del %0\n';
                }
            break;
        case 2:

            CMDvar += 'cd "'+tempPNGs[0].parent.fsName+'";"'+OSappPath[2]+'" "'+loc2+'" '+tempFileNames+'1 '+compFPS+' -l'+l+';';

            if($.os.toLowerCase().indexOf("mac") == 0){
                CMDvar += "rm -rf \"" + tempPNGs[0].parent.fsName + "\";"+
                    "rm \"" + CMDpath + "\";"+
                    "open \"" + ppFolder1 + "\";"+
                    "osascript -e 'tell application \"Terminal\" to close first window' & exit;";
                var tempcmds = "chmod +x '" + CMDpath + "'";
                }else{
                    CMDvar ='@echo off\n'+
                    'setlocal enabledelayedexpansion\n'+
                    'set SrcFolder="'+pFolder+'"\n'+
                    'set DstFileApng="'+loc2+'"\n'+

                    'set apngasm="'+OSappPath[2]+'"\n'+

                    'set pngq="'+OSappPath[0]+'"\n'+
                    '\n'+
                    'set /a loop = '+l+'\n'+
                    'set /a fps = '+compFPS+'\n'+
                    'set /a q = '+q+'\n'+
                    'set /a fDuraton = 1000/%fps%\n'+
                    '\n'+
                    'cd /d %SrcFolder%\n'+
                    'for /f "delims=" %%i in (\'"dir /a/s/b/on *.png*"\') do (  \n'+
                    '  echo %%i\n'+
                    '  %pngq% "%%~nxi" --speed 1 --quality %q% -f --ext .png\n'+
                    '  set "imgs=!imgs!"%%i" "\n'+
                    ') \n'+
                    'echo %imgs%\n'+
                    '\n'+
                    '%apngasm% %DstFileApng% %imgs% 1 %fps% -l%loop%\n'+

                    '\n'+
                    'cd ..\n'+
                    'rd /s /Q %SrcFolder%\n'+
                    '\n'+
                    'cd "'+ppFolder1+'"\n'+
                    'start .\n'+
                    'del %0\n';
                }
            break;
        case 3:
            CMDvar += 'cd "'+tempPNGs[0].parent.fsName+'";'
            CMDvar += '"'+OSappPath[1]+'"  -loop '+l+' -d '+1000*app.project.activeItem.frameDuration+' -lossy -q '+q+' '+tempFileNames+'-o "'+loc+'";';
            if($.os.toLowerCase().indexOf("mac") == 0){
                CMDvar += "rm -rf \"" + tempPNGs[0].parent.fsName + "\";"+
                            "rm \"" + CMDpath + "\";"+
                            "open \"" + ppFolder0 + "\";"+
                            "osascript -e 'tell application \"Terminal\" to close first window' & exit;";
                    var tempcmds = "chmod +x '" + CMDpath + "'";
                }else{
                    CMDvar ='@echo off\n'+
                    'setlocal enabledelayedexpansion\n'+
                    'set SrcFolder="'+pFolder+'"\n'+

                    'set DstFileWebp="'+loc+'"\n'+

                    'set img2webp="'+OSappPath[1]+'"\n'+
                    'set pngq="'+OSappPath[0]+'"\n'+
                    '\n'+
                    'set /a loop = '+l+'\n'+
                    'set /a fps = '+compFPS+'\n'+
                    'set /a q = '+q+'\n'+
                    'set /a fDuraton = 1000/%fps%\n'+
                    '\n'+
                    'cd /d %SrcFolder%\n'+
                    'for /f "delims=" %%i in (\'"dir /a/s/b/on *.png*"\') do (  \n'+
                    '  echo %%i\n'+
                    '  %pngq% "%%~nxi" --speed 1 --quality %q% -f --ext .png\n'+
                    '  set "imgs=!imgs!"%%i" "\n'+
                    ') \n'+
                    'echo %imgs%\n'+
                    '\n'+

                    '%img2webp% -loop %loop% -lossy -q 100 -d %fDuraton% %imgs% -o %DstFileWebp%\n'+
                    '\n'+
                    'cd ..\n'+
                    'rd /s /Q %SrcFolder%\n'+
                    '\n'+
                    'cd "'+ppFolder0+'"\n'+
                    'start .\n';
                    'del %0\n';
                }
            break;
        default:
            break;

    }
    var temp = new File(CMDpath);
    temp.open("w");
    temp.encoding = theEnc;
    temp.lineFeed = theLF;
    temp.write(CMDvar);
    temp.close();
    if($.os.toLowerCase().indexOf("mac") == 0){
        system.callSystem(tempcmds);
    }
    temp.execute();

}