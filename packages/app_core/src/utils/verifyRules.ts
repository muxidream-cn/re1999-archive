/**
 * 验证单个 8 位数字是否是有效的年月日格式
 * @param dateNum 8 位日期数字
 */
function isValidDate(dateNum: number | string) {
  let isNum = true
  if (typeof dateNum === "string" && dateNum.length === 8) isNum = false
  else if (typeof dateNum !== "number" || dateNum.toString().length !== 8) return false // 确保是8位数字
  const str = (isNum ? dateNum.toString() : dateNum) as string
  const year = parseInt(str.slice(0, 4), 10)
  const month = parseInt(str.slice(4, 6), 10)
  const day = parseInt(str.slice(6, 8), 10)

  // 验证日期合法性
  const date = new Date(year, month - 1, day) // JavaScript 中月份从 0 开始
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

const verifyRules = {
  /**验证昵称*/
  userName: (rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("昵称不能为空，请输入2-10位中文、字母、或数字！"))
    }
    setTimeout(() => {
      const reg = /[^\u4E00-\u9FA5a-zA-Z0-9]/i
      if (reg.test(value) || value.length > 10 || value.length < 2) {
        callback(new Error("请输入2-10位中文、字母、或数字！"))
      } else {
        callback()
      }
    }, 1000)
  },
  /**验证邮箱*/
  email: (rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("邮箱不能为空！请输入邮箱地址！"))
    }
    setTimeout(() => {
      const reg = /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+(([.-])[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/i
      if (!reg.test(value)) {
        callback(new Error("请输入正确的邮箱地址！"))
      } else {
        callback()
      }
    }, 1000)
  },
  /**验证密码*/
  password: (rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("密码不能为空！请输入密码！"))
    }
    setTimeout(() => {
      const reg = /^([A-Za-z\d\-&.,()\s]+)+$/i
      if (!reg.test(value) || value.length < 6 || value.length > 18) {
        callback(new Error("请输入6-18位不含特殊字符的密码！"))
      } else {
        callback()
      }
    }, 1000)
  },
  //确认密码
  // 	validatePassword: (rule: any, value: any, callback: any) => {
  // 		if (value === '') {
  // 			callback(new Error('请确认密码！'))
  // 		} else if (value !== ruleForm.password) {
  // 			callback(new Error("两次输入的密码不匹配！"))
  // 		} else {
  // 			callback()
  // 		}
  // 	},
  /**验证邮箱验证码*/
  emailCode: (rule: any, value: string, callback: any) => {
    if (value === "") {
      callback(new Error("请输入邮箱验证码，大小写敏感！"))
    } else if (value.length !== 6) {
      callback(new Error("邮箱验证码位数错误！"))
    } else {
      callback()
    }
  },
  /**验证隐私政策*/
  policy: (rule: any, value: boolean, callback: any) => {
    if (value === false) callback(new Error("请先阅读并勾选隐私政策！"))
    else callback()
  },

  //修改邮箱的验证
  // checkEmail: (rule: any, value: any, callback: any) => {
  // 	const reg = /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+(([.\-])[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/i;
  // 	if (!value)
  // 		return callback(new Error('邮箱不能为空！请输入邮箱地址！'))
  // 	else if (value !== email.value)
  // 		return callback(new Error('输入的邮箱与本账号邮箱不匹配！'))
  // 	else if (!reg.test(value))
  // 		return callback(new Error('请输入正确的邮箱地址！'))
  // 	else
  // 		return callback()
  // },
  /**验证非空字符串*/
  text: (rule: any, value: string | number, callback: any) => {
    if (!value && value !== "0" && value !== 0) callback(new Error("该字段不能为空！"))
    else callback()
  },
  /**验证8位数字的日期格式【数组】*/
  timeArray: (rule: any, value: number[], callback: any) => {
    if (!value?.length)
      callback() // 允许空数组
    else if (value.every(isValidDate))
      callback() // 使用封装的单个日期验证函数
    else callback(new Error("格式不正确，应为8位数字的日期格式！"))
  },
}
export default verifyRules
