const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
// 读取文件内容
const readFile = (path) => {
    return new Promise(resolve => {
        fs.readFile(path, 'utf-8', (err, data) => {
            console.log('test.html 读取成功！--NO1')
            resolve(data)
        })
    })
}
// 写文件内容
const writeFile = (path, data) => {
    return new Promise(resolve => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                console.log(err)
            }
            resolve()
        })
    })
}
module.exports =  function(context) {
    vscode.commands.registerCommand('extension.replaceShark', async () => {
        // 1.获取当前项目的 defaultLanguageJson 文件，
        let document = vscode.window.activeTextEditor.document
        const fileName    = document.fileName;
        const workDir     = path.dirname(fileName);
        const jsonpath = workDir+'/test/language.json'
        let jsonFile = await readFile(jsonpath)
        let defaultLanguageJson = JSON.parse(jsonFile);
        // 2.执行替换逻辑
        const { activeTextEditor } = vscode.window;
        // languageId 文件类型 不是扩展名
        if (activeTextEditor && activeTextEditor.document.languageId === 'javascript' || activeTextEditor.document.languageId === 'typescriptreact') {
            let codeFileTmp = await readFile(fileName)
            let codeFile = '';
            for (let i in defaultLanguageJson) {
                let itemObj = defaultLanguageJson[i];
                itemObj.replace(/\(/g, '（').replace(/\)/g, '）');
                // 正则修改 匹配 {'车型'}  => {sharkData['storemange.pickupandreturnacarfromanotherstore.model']}
                var textReg = new RegExp("'" + itemObj + "'", 'gm');
                // 正则修改 匹配 "车型"  => {sharkData['storemange.pickupandreturnacarfromanotherstore.model']}
                // var textReg = new RegExp("\"" + itemObj + "\"", 'gm');
                // 正则修改
                if (codeFile) {
                codeFile = codeFile.replace(textReg, `sharkData['${i}']`);
                } else {
                codeFile = codeFileTmp.replace(textReg, `sharkData['${itemObj}']`);
                }
            }
            if (codeFile.indexOf('useShark') == -1) {
                codeFile = `import { useShark } from 'utils/hooks';\n${codeFile}`;
            }
            // 添加 const sharkData = useShark(); 放在 export default FUNName　中 FUNName中
            // 寻找FUNName　的字符串
            // 匹配　FUNName　的字符串　添加　const sharkData = useShark();
            let funNameReg = /^(export)\s{1,}(default)\s{1,}(\S*)\;$/gm;
            let funNameRegContainBrackets = /\((.*)\)/g;
            let resu = funNameReg.exec(codeFile);
            let funName = resu && resu[3];
            if (funName) {
                // funName 是 'React.memo(AreaDetailsModal)'
                // 摘出 AreaDetailsModal
                let funNameTmp = funNameRegContainBrackets.exec(funName);
                if (funNameTmp) {
                    funName = funNameTmp[1];
                }
                let funNameCode = new RegExp(funName + '\\s{1,}=\\s{1,}(.*)\\s{0,}=>\\s{0,}{$', 'gm');
                if (codeFile.indexOf('useShark()') == -1) {
                let funNameCodeLine = codeFile.match(funNameCode) && codeFile.match(funNameCode)[0];
                codeFile = codeFile.replace(funNameCode, funNameCodeLine + `\n  const sharkData = useShark();\n`);
                }
            }
            vscode.window.showInformationMessage('正在替换中文');
            await writeFile(fileName, codeFile);
            vscode.window.showInformationMessage('替换成功');
        }
      });
};