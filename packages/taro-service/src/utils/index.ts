import * as path from 'path'

import { merge } from 'lodash'
import * as resolve from 'resolve'
import { getModuleDefaultExport } from '@tarojs/helper'
import { PluginItem } from '@tarojs/taro/types/compile'

import { PluginType } from './constants'
import { IPlugin } from './types'

export const isNpmPkg: (name: string) => boolean = name => !(/^(\.|\/)/.test(name))

export function getPluginPath (pluginPath: string) {
  if (isNpmPkg(pluginPath) || path.isAbsolute(pluginPath)) return pluginPath
  throw new Error('plugin 和 preset 配置必须为绝对路径或者包名')
}

export function convertPluginsToObject (items: PluginItem[]) {
  return () => {
    const obj = {}
    items.forEach(item => {
      if (typeof item === 'string') {
        const name = getPluginPath(item)
        obj[name] = null
      } else if (Array.isArray(item)) {
        const name = getPluginPath(item[0])
        obj[name] = item[1]
      }
    })
    return obj
  }
}

export function mergePlugins (dist: PluginItem[], src: PluginItem[]) {
  return () => {
    const srcObj = convertPluginsToObject(src)()
    const distObj = convertPluginsToObject(dist)()
    return merge(srcObj, distObj)
  }
}

// getModuleDefaultExport
export function resolvePresetsOrPlugins (root: string, args, type: PluginType): IPlugin[] {
  return Object.keys(args).map(item => {
    const fPath = resolve.sync(item, {
      basedir: root,
      extensions: ['.js', '.ts']
    })
    return {
      id: fPath,
      path: fPath,
      type,
      opts: args[item] || {},
      apply () {
        try {
          return getModuleDefaultExport(require(fPath))
        } catch (err) {
          throw err
        }
      }
    }
  })
}