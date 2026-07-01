import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import connectDB from './db'

async function getCakes() {
  const { rows } = await global.dbclient.query(`
    SELECT
      p.product_id,
      p.article,
      p.name,
      p.unit_id,
      p.price,
      p.confectionery_id,
      p.cake_type_id,
      p.discount_percent,
      p.stock_quantity,
      p.description,
      p.photo_filename,
      u.name AS unit_name,
      c.name AS confectionery_name,
      ct.name AS cake_type_name
    FROM products p
    JOIN units u ON u.unit_id = p.unit_id
    JOIN confectioneries c ON c.confectionery_id = p.confectionery_id
    JOIN cake_types ct ON ct.cake_type_id = p.cake_type_id
    ORDER BY p.product_id
  `)

  return rows
}

async function getReferences() {
  const [units, confectioneries, cakeTypes] = await Promise.all([
    global.dbclient.query('SELECT unit_id, name FROM units ORDER BY unit_id'),
    global.dbclient.query('SELECT confectionery_id, name FROM confectioneries ORDER BY name'),
    global.dbclient.query('SELECT cake_type_id, name FROM cake_types ORDER BY name')
  ])

  return {
    units: units.rows,
    confectioneries: confectioneries.rows,
    cakeTypes: cakeTypes.rows
  }
}

async function createCake(event, cake) {
  await global.dbclient.query(
    `
      INSERT INTO products (
        article,
        name,
        unit_id,
        price,
        confectionery_id,
        cake_type_id,
        discount_percent,
        stock_quantity,
        description,
        photo_filename
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    getCakeValues(cake)
  )
}

async function updateCake(event, cake) {
  await global.dbclient.query(
    `
      UPDATE products
      SET
        article = $1,
        name = $2,
        unit_id = $3,
        price = $4,
        confectionery_id = $5,
        cake_type_id = $6,
        discount_percent = $7,
        stock_quantity = $8,
        description = $9,
        photo_filename = $10
      WHERE product_id = $11
    `,
    [...getCakeValues(cake), Number(cake.product_id)]
  )
}

async function deleteCake(event, productId) {
  try {
    await global.dbclient.query('DELETE FROM products WHERE product_id = $1', [Number(productId)])
  } catch (e) {
    if (e.code === '23503') {
      throw new Error('Нельзя удалить торт, который уже используется в заказах')
    }

    throw e
  }
}

function getCakeValues(cake) {
  return [
    cake.article,
    cake.name,
    Number(cake.unit_id),
    Number(cake.price),
    Number(cake.confectionery_id),
    Number(cake.cake_type_id),
    Number(cake.discount_percent || 0),
    Number(cake.stock_quantity || 0),
    cake.description || null,
    cake.photo_filename || null
  ]
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  global.dbclient = await connectDB()

  ipcMain.handle('cakes:getAll', getCakes)
  ipcMain.handle('cakes:getReferences', getReferences)
  ipcMain.handle('cakes:create', createCake)
  ipcMain.handle('cakes:update', updateCake)
  ipcMain.handle('cakes:delete', deleteCake)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    global.dbclient?.end()
    app.quit()
  }
})
