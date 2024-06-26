
import { Ollama } from 'ollama'
import { sleep } from './util';

const ollama = new Ollama({ host: 'http://10.10.10.227:11434' })
async function think(action: Action, actions: Array<Action>, history: Array<ActionRecord>) {
    const content = `这是你尚未执行的动作:${JSON.stringify(actions.slice(5))}。\n` +
        `你当前需要:"` + action.type + '"\n' +
        (() => {
            if (action.type == '重新输出一个JSON格式数据,禁止其他解释') {
                return `底下是一个文本字符：\n` +
                    `"""${action.content}"""` +
                    `请按步骤执行：\n` +
                    `1.如果能从文本中提取一个json格式子串就输出该JSON格式子串,并终止后续步骤。注意仅输出合法json,禁止任何解释。\n` +
                    `2.如果无法提取json格式子串,输出:{"chose":"redo"},禁止任何解释`;
            }
            if (action.type == '分析代码执行结果') {
                return `原结果如下由3个双引号括起来：\n` +
                    `"""${action.content}"""\n` +
                    `请按步骤执行：\n` +
                    `1.如果上方的文本已符合目标"${JSON.stringify(history[0].action)}"，就输出:{"chose":"next"},注意仅输出合法json,禁止任何解释。并终止后续步骤。\n` +
                    `2.是否需要改进nodejs代码重新执行,是否继续拆分步骤。选择结果记为<chose>,<chose>可以等于"eval"或"steps"\n` +
                    `3.如果<chose>为"eval":请给出新的nodejs代码,记为<eval>\n` +
                    `4.如果<chose>为"steps":请用一个Array<string>类型的数据描述拆分后的步骤，记为<steps>\n` +
                    `5.输出一个json结果:{"chose":"<eval或steps>","eval":"<eval代码>",steps:<步骤steps>},注意仅输出合法json,禁止任何解释`
            }
            if (action.type == '拆解目标或代码实现') {
                return `你当前目标是:` +
                    `<${action.content}>` +
                    `请按步骤执行：\n` +
                    // `1.如果已实现当前目标,输出:{"desc":"<简要解释为什么已达到>","done":true},注意仅输出合法json。并终止后续步骤。\n` +
                    `1.分析当前目标能否用nodejs实现？如果可以通过nodejs代码直接实现一段可供eval()调用的代码,输出:{"chose":"eval","eval":"<nodejs代码>"},并终止后续步骤。注意仅输出合法json，不要任何解释。\n` +
                    `2.如果无法用nodejs直接实现，请一个Array<string>类型的数据表述拆分的目标步骤,输出:{"chose":"steps","steps":[<拆分的步骤>]},注意仅输出合法json，不要任何解释`;
                // `2.如果<chose>为"eval":请给出一段可以执行并达到目的的nodejs代码,记为<eval>。\n` +
                // `3.如果<chose>为"steps":请用一个数组记为<steps>用于描述拆分步骤\n` +
                // `3.输出一个json结果:{"chose":"<eval或steps>","eval":"<eval代码>",steps:<步骤steps>},注意仅输出合法json,禁止任何解释`
            }

        })();
    // console.log(content);
    const messages = [{
        role: 'user', content:
            `你是一个能将目标逐步拆解为可执行的nodejs代码的机器人。\n` +
            `你需要根据我的要求返回json格式数据,所有的解释都放在"desc"字段中，比如:{"desc":"好的","其他字段":<其他要求的数据>}。`
    }, { role: 'assistant', content: '好的' },
    { role: 'user', content: `这是你最近已完成动作的数据:${JSON.stringify(history.slice(0, 5).reverse())}。\n` },
    { role: 'assistant', content: '好的，我已知晓最近的动作，请继续说出您的需求' },
    {
        role: 'user', content
    }];
    console.log('输入消息给模型:', JSON.stringify(messages, null, '  '))
    const res = await ollama.chat({
        model: 'openchat:latest',
        // options: { temperature: 0.8 },
        keep_alive: '-1m',
        messages,
    })
    let { role, content: c } = res.message;

    return res;
}
const history: Array<ActionRecord> = [];

let count = 0;
export async function doActions(actions: Action[]) {
    while (actions.length) {
        await sleep(1000);
        console.log(`单轮起始[${count}]-------------------------------------`)
        let res = await think(actions[0], actions, history);
        let { role, content } = res.message;
        console.log(`模型回答[${count}]-------------------------------------\n`, content);
        console.log(`单轮结束[${count}]-------------------------------------`)
        count++;
        try {
            //    提取```json\n{ /*不出现```的 json代码*/ }```
            let jsonTxt = /```json\s+([\s\S]*?)```/.exec(content)?.[1];
            let jsTxt = /```javascript\s+([[\s\S]*?)```/.exec(content)?.[1];
            let json2Txt = /{([\s\S]*?)}/.exec(content)?.[1];
            let result: Result = { "chose": "eval" };
            if (jsTxt) result.eval = jsTxt;
            else if (jsonTxt) result = JSON.parse(jsonTxt) as Result;
            else if (json2Txt) result = JSON.parse(json2Txt) as Result;
            else result = JSON.parse(content);
            history.unshift({ time: new Date(), action: actions[0], result });
            actions.shift();
            if (result.done) {
                break;
            }
            if (result.chose === 'redo') {// 重新执行
                continue;
            } else if (result.chose === 'next') { // 通过执行
                continue;
            } else if (result.chose === 'eval') {
                let nextThink: Action = {
                    type: '分析代码执行结果',
                    content: ''
                }
                try {
                    let output = await eval(result.eval as string);
                    nextThink.content = `执行成功!输出:` + output;
                } catch (error) {
                    debugger
                    nextThink.content = `执行报错!输出:` + Object.prototype.toString.call(error)
                }
                actions.unshift(nextThink);
            } else if (result.chose === 'steps') {
                (result.steps as string[]).forEach(step => actions.unshift({ type: '拆解目标或代码实现', content: step }));
            }
        } catch (error) {
            let nextThink: Action = {
                type: '重新输出一个JSON格式数据,禁止其他解释',
                content: content
            }
            debugger
            actions.unshift(nextThink);
        }
    }
}
