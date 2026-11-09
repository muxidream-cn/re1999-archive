// .prettierrc.cjs
// @see: https://www.prettier.cn

module.exports = {
  // 使 Prettier 自动格式化 Tailwind CSS 类的顺序  // "@trivago/prettier-plugin-sort-imports"配合eslint对导入进行排序，与下方现有配置有冲突(使用后class类名无法排序)
  plugins: ["prettier-plugin-tailwindcss", "prettier-plugin-packagejson"],
  // 指定最大换行长度(HTML 和 Vue 模板中的元素)
  printWidth: 150,
  // 强制文本换行(Markdown 和纯文本内容)
  proseWrap: "always",
  // 缩进制表符宽度 | 空格数
  tabWidth: 2,
  // 使用制表符而不是空格缩进行 (true：制表符，false：空格) [空格更易于在不同编辑器下控制和确保一致性]
  useTabs: false,
  // 结尾不用分号 (true：有，false：没有)
  semi: false,
  // 使用单引号 (true：单引号，false：双引号)
  singleQuote: false,
  // 在对象字面量中决定是否将属性名用引号括起来 可选值 "<as-needed|consistent|preserve>"
  quoteProps: "as-needed",
  // 在JSX中使用单引号而不是双引号 (true：单引号，false：双引号)
  jsxSingleQuote: true,
  // 多行时尽可能打印尾随逗号 "<none|es5|all>" ["es5"：在对象和数组中，只有在 ES5 允许的地方（即多行时）才添加尾随逗号 可选值]
  trailingComma: "es5",
  // 在对象，数组括号与文字之间加空格 "{ foo: bar }" (true：有，false：没有)
  bracketSpacing: true,
  // 将 > 多行元素放在最后一行的末尾，而不是单独放在下一行 (true：放末尾，false：单独一行)
  bracketSameLine: false,
  // (x) => {} 箭头函数参数只有一个时是否要有小括号 (avoid：省略括号，always：不省略括号)
  // arrowParens: "avoid",
  // 指定要使用的解析器，不需要写文件开头的 @prettier
  requirePragma: false,
  // 可以在文件顶部插入一个特殊标记，指定该文件已使用 Prettier 格式化
  insertPragma: false,
  // 在html中空格是否是敏感的 "css" - 遵守 CSS 显示属性的默认值， "strict" - 空格被认为是敏感的 ，"ignore" - 空格被认为是不敏感的
  htmlWhitespaceSensitivity: "css",
  // 控制在 Vue 单文件组件中 <script> 和 <style scoped> 标签内的代码缩进方式 [false：代码不会额外缩进，与外部代码对齐。true：会相对于组件的其他部分进行缩进。]
  vueIndentScriptAndStyle: false,
  // 换行符 ("auto"：根据当前操作系统自动选择换行符,"lf"：Linux和macOS,"crlf"：Windows,"cr":旧操作系统)
  endOfLine: "auto",
  // 这两个选项可用于格式化以给定字符偏移量（分别包括和不包括）开始和结束的代码 (rangeStart：开始，rangeEnd：结束)
  rangeStart: 0,
  rangeEnd: Infinity,
  // // 导入排序规则，若某行不需要排序，在上方添加// sort-imports-ignore   // "@trivago/prettier-plugin-sort-imports"配合eslint对导入进行排序，与下方现有配置有冲突(使用后class类名无法排序)
  // importOrder: [
  //   "<BUILTIN_MODULES>", // Node内置模块，如: 'fs', 'path', 'url'
  //   "<THIRD_PARTY_MODULES>", // 第三方模块，如: 'react', 'vue'
  //   "^@/router/(.*)$", // 自定义路径
  //   "^@/axios/(.*)$", // 自定义路径
  //   "^@/stores/(.*)$", // 自定义路径
  //   "^@/hooks/(.*)$", // 自定义路径
  //   "^@/utils/(.*)$", // 自定义路径
  //   "^@/views/(.*)$", // 自定义路径
  //   "^@/components/(.*)$", // 自定义路径
  //   "^@/assets/(.*)$", // 自定义路径
  //   "^@/types/(.*)$", // 自定义路径
  //   "^[./]",
  // ],
}
