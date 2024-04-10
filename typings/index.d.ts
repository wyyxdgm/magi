type Action = { type: '分析代码执行结果' | '解析JSON格式数据' | '拆解目标或代码实现', content: string };
type ActionRecord = { time: Date, action: Action, result: Result };

type Result = {
  done?: boolean,
  desc?: string,
  chose?: string,
  eval?: string,
  steps?: Array<string>
}
