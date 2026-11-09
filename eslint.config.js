// @see: https://eslint.nodejs.cn/docs
// import 导入排序规则：https://github.com/import-js/eslint-plugin-import
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import eslint from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import importPlugin from "eslint-plugin-import"
// jsdoc 配置及规则参考：https://www.dongaigc.com/p/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-configuration-flat-config
import jsdoc from "eslint-plugin-jsdoc"
import eslintPluginVue from "eslint-plugin-vue"
import globals from "globals"
import tseslint from "typescript-eslint"
import vueParser from "vue-eslint-parser"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 只为各子项目的文件匹配各自的 tsconfig，避免 import 解析时加载全部项目。
const _tsProjectCandidates = [
  // 添加子项目的 tsconfig.json
  path.resolve(__dirname, "tsconfig.json"),
  path.resolve(__dirname, "packages/app_web/tsconfig.json"),
  path.resolve(__dirname, "packages/app_android/tsconfig.json"),
  path.resolve(__dirname, "packages/app_windows/tsconfig.json"),
  path.resolve(__dirname, "packages/app_core/tsconfig.json"),
  path.resolve(__dirname, "packages/app_build/tsconfig.json"),
  path.resolve(__dirname, "packages/app_server/tsconfig.app.json"),
  path.resolve(__dirname, "schema/tsconfig.json"),
  path.resolve(__dirname, "types/tsconfig.json"),
  path.resolve(__dirname, "utils/tsconfig.json"),
]

// 过滤不存在的 tsconfig
const tsProjectPaths = _tsProjectCandidates.filter((p) => fs.existsSync(p))

const tsProjectResolverConfigs = tsProjectPaths.map((projectPath) => {
  const projectDirectory = path.relative(__dirname, path.dirname(projectPath)).replaceAll(path.sep, "/")
  const filePattern = projectDirectory ? `${projectDirectory}/**/*.{ts,tsx,vue}` : "**/*.{ts,tsx,vue}"

  return {
    files: [filePattern],
    settings: {
      "import/resolver": {
        typescript: {
          project: [projectPath],
        },
      },
    },
  }
})

// 自定义规则
const rules = {
  // 对象结尾逗号
  "comma-dangle": "off",

  // JSDoc 需要描述信息
  "jsdoc/require-description": "warn",

  // JSDoc 不需要返回信息
  "jsdoc/require-returns": "off",

  // JSDoc 不需要返回描述信息
  "jsdoc/require-returns-description": "off",

  // 关闭未定义变量
  "no-undef": "off",

  //不使用的变量不报错
  "no-unused-vars": "off",

  // 禁止使用不规范的空格
  "no-irregular-whitespace": "off",

  // 构造函数首字母大写
  "new-cap": [2, { newIsCap: true, capIsNew: false }],

  // new 操作符使用时需要括号
  "new-parens": 2,

  // 禁止使用 Array 构造函数
  "no-array-constructor": 2,

  // 禁止调用 caller 和 callee
  "no-caller": 2,

  // 禁止重新分配类名
  "no-class-assign": 2,

  // 禁止条件中的赋值操作
  "no-cond-assign": 2,

  // 禁止 const 重新分配
  "no-const-assign": 2,
  // 禁止删除变量
  "no-delete-var": 2,

  // 禁止在函数参数中使用重复名称
  "no-dupe-args": 2,

  // 禁止在类中使用重复名称的成员
  "no-dupe-class-members": 2,

  // 禁止在对象字面量中使用重复的键
  "no-dupe-keys": 2,

  // 禁止重复的 case 标签
  "no-duplicate-case": 2,

  // 禁止空的字符类
  "no-empty-character-class": 2,

  // 禁止空的解构模式
  "no-empty-pattern": 2,

  // 禁止使用 eval
  "no-eval": 2,

  // 不允许出现空的代码块
  "no-empty": 2,

  // 禁止不必要的布尔转换
  "no-extra-boolean-cast": 2,

  // 禁止不必要的括号
  "no-extra-parens": [2, "functions"],

  // 禁止 case 语句落空
  "no-fallthrough": 2,

  // 禁止在数字后面添加小数点
  "no-floating-decimal": 2,

  // 禁止对函数声明重新赋值
  "no-func-assign": 2,

  // 禁止出现歧义多行表达式
  "no-unexpected-multiline": 2,

  // 禁止不需要的转义
  "no-useless-escape": 0,

  "vue/no-mutating-props": ["error", { shallowOnly: true }],

  // 要求组件名称始终为 “-” 链接的单词
  "vue/multi-word-component-names": "off",

  // 关闭 index.html 文件报 clear 错误
  "vue/comment-directive": "off",

  // 关闭对 defineProps 的有效性检查
  "vue/valid-define-props": "off",

  // 允许在一个文件中定义多个组件
  "vue/one-component-per-file": "off",

  // 关闭 Prop 类型要求的警告
  "vue/require-prop-types": "off",

  // 属性顺序要求
  "vue/attributes-order": [
    "error",
    {
      order: [
        "DEFINITION", // e.g. 'is', 'v-is'
        "LIST_RENDERING", // e.g. 'v-for item in items'
        "CONDITIONALS", // e.g. 'v-if', 'v-else-if', 'v-else', 'v-show', 'v-cloak'
        "RENDER_MODIFIERS", // e.g. 'v-once', 'v-pre'
        "GLOBAL", // e.g. 'id'
        "UNIQUE", // e.g. 'ref', 'key'
        "SLOT", // e.g. 'v-slot', 'slot'
        "TWO_WAY_BINDING", // e.g. 'v-model'
        "OTHER_DIRECTIVES", // e.g. 'v-custom-directive'
        "OTHER_ATTR", // Includes ATTR_DYNAMIC, ATTR_STATIC, ATTR_SHORTHAND_BOOL
        "EVENTS", // e.g. '@click="functionCall"', 'v-on="event"'
        "CONTENT", // e.g. 'v-text', 'v-html'
      ],
      alphabetical: false, //同组内的属性会按字母排序(true)
    },
  ],

  // 关闭对默认 Prop 的要求
  "vue/require-default-prop": "off",

  // 允许使用 v-html 指令
  "vue/no-v-html": "off",

  // 检查 import 的路径是否能被解析
  "import/no-unresolved": [
    "error",
    {
      // 忽略虚拟组件
      ignore: ["^virtual:"],
    },
  ],

  "no-duplicate-imports": "error",

  // 确保从模块中导入的命名导出在实际模块中存在
  "import/named": "error",

  // 确保默认导入（default import）在模块中存在
  "import/default": "error",

  // 确保命名空间导入（import * as xxx）时，导入的对象是合法的模块对象
  "import/namespace": "error",

  // 检查 export 语法的正确性（例如重复导出或错误的导出引用）
  "import/export": "error",

  // 检测重复导入同一个模块（例如重复 `import 'lodash'`），仅警告
  "import/no-duplicates": "warn",

  // 控制 import 语句的分组与排序规则
  "import/order": [
    "error",
    {
      // 分组顺序定义：从上到下依次排序
      groups: [
        "builtin", // Node.js 内置模块（fs、path 等）
        "external", // 外部依赖包（npm 包，例如 vue、axios）
        "internal", // 内部模块（项目 src 目录别名路径，如 @/utils）
        "parent", // 父级目录导入（../）
        "sibling", // 同级目录导入（./）
        "index", // 当前目录下的 index 文件导入（./index）
        "object", // 对象类型导入（ES2022 提案中的 import from object）
        "type", // TypeScript 的类型导入（import type {...}）
      ],
      // 不同分组之间必须空一行
      "newlines-between": "always",
      // 按字母顺序排序
      alphabetize: {
        order: "asc", // 升序（A → Z）
        caseInsensitive: true, // 忽略大小写
      },
    },
  ],
}

export default [
  {
    /**忽略格式检查的文件列表*/
    ignores: [
      "**/node_modules",
      "**/dist",
      "**/.gitignore",
      "**/package-lock.json",
      "**/dist-ssr",
      "**/*.local",
      "**/.npmrc",
      "**/.DS_Store",
      "**/dev-dist",
      "**/dist_electron",
      "**/*.d.ts",
      "**/src/assets/**",
      "**/src-tauri/target",
      "**/*.config.{js,ts,cjs,mjs}",
      "**/.prettierrc.*",
      "**/.eslintrc.*",
      "**/eslint.config.*",
      "**/components/ui/**", //忽略 shadcn-vue 的 ui 组件
      "**/examples", //忽略tauri的示例项目
    ],
  },
  /** js推荐配置 */
  eslint.configs.recommended,
  /** vue 推荐配置 */
  ...eslintPluginVue.configs["flat/recommended"],
  /** JSDoc 推荐配置 */
  jsdoc.configs["flat/recommended-typescript"],

  /**自定义规则：JS 文件（不使用 typescript typed lint）*/
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      parser: vueParser,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
      },
    },
    plugins: {
      vue: eslintPluginVue,
      jsdoc,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".json"],
        },
      },
    },
    rules: {
      ...rules,
    },
  },

  /**自定义规则：TS 和 Vue 文件*/
  {
    files: ["**/*.{ts,tsx,vue}"],
    languageOptions: {
      parser: vueParser,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        /** typescript项目需要用到这个 */
        parser: tseslint.parser,
        ecmaVersion: "latest",
        extraFileExtensions: [".vue"],
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      vue: eslintPluginVue,
      jsdoc,
      import: importPlugin, // 直接使用插件对象
    },
    settings: {
      // 仅保留 node 解析，flat config 不再支持 typescript 解析器
      "import/resolver": {
        node: {
          extensions: [".js", ".json"],
        },
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    },
    rules: {
      ...rules,
    },
  },
  ...tsProjectResolverConfigs,
  /** 由 Prettier 独立格式化，关闭 ESLint 中与其冲突的规则 */
  eslintConfigPrettier,
]
