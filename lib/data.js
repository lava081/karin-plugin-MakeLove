import { Sequelize, DataTypes } from 'sequelize'

class DB {
  static init () {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './data/karin-plugin-MakeLove/tou.db',
      logging: false
    })

    /** 用户模型 */
    this.User = sequelize.define('User', {
      id: {
        /** 整数类型 */
        type: DataTypes.INTEGER,
        /** 自增 */
        autoIncrement: true,
        /** 主键 */
        primaryKey: true,
        /** 禁止为空 */
        allowNull: false,
        /** 描述 */
        comment: '自增ID，主键'
      },
      user_id: {
        type: DataTypes.STRING,
        /** 唯一性 */
        unique: true,
        allowNull: false,
        comment: '用户id'
      },
      energy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '能量，单位cal'
      },
      cum: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '容积，单位ml'
      },
      cnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '次数'
      },
      other: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: '预留一个键'
      }
    }, {})
    this.sql = sequelize
  }

  /**
   * 初始化角色数据
   * @param {Number|String} user_id - 用户id
   */
  static async initUser (user_id) {
    try {
      return await this.User.create({
        user_id: String(user_id),
        energy: 0,
        cum: 0,
        cnt: 0
      })
    } catch (error) {
      return error
    }
  }

  /**
   * 根据user_id读取对应信息
   * @param {string} user_id - 用户id
   * @returns {Promise<object>}
   */
  static async getUser (user_id) {
    try {
      return await this.User.findOne({
        where: { user_id: String(user_id) }
      })
    } catch (error) {
      console.error('获取用户时出错:', error)
      return null
    }
  }
}

/** 初始化数据库 */
DB.init()

/** 同步 */
try {
  await DB.sql.sync()
  console.log('数据库同步成功')
} catch (error) {
  console.error('同步出错:', error)
}

export default DB