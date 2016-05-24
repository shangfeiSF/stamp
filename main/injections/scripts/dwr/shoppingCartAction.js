// Provide a default path to dwr.engine
if (dwr == null) var dwr = {};
if (dwr.engine == null) dwr.engine = {};
if (DWREngine == null) var DWREngine = dwr.engine;

if (ShoppingCartAction == null) var ShoppingCartAction = {};
ShoppingCartAction._path = '/dwr';
ShoppingCartAction.addGoodsToShoppingCartDWR = function (p0, p1, p2, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'addGoodsToShoppingCartDWR', p0, p1, p2, callback);
}
ShoppingCartAction.addGoodsToShoppingCartLS = function (p0, p1, p2, callback, mock) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'addGoodsToShoppingCartLS', p0, p1, p2, callback, mock);
}
ShoppingCartAction.checkShoppingCartTid = function (p0, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'checkShoppingCartTid', p0, callback);
}
ShoppingCartAction.removeDwrShoppingCart = function (p0, p1, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'removeDwrShoppingCart', p0, p1, callback);
}
ShoppingCartAction.removeDwrShoppingCartVolume = function (p0, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'removeDwrShoppingCartVolume', p0, callback);
}
ShoppingCartAction.removeDwrShoppingCartPromation = function (p0, p1, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'removeDwrShoppingCartPromation', p0, p1, callback);
}
ShoppingCartAction.fullGivePromationDwrShoppingCart = function (p0, p1, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'fullGivePromationDwrShoppingCart', p0, p1, callback);
}
ShoppingCartAction.editDwrShoppingCartNum = function (p0, p1, p2, callback) {
  dwr.engine._execute(ShoppingCartAction._path, 'ShoppingCartAction', 'editDwrShoppingCartNum', p0, p1, p2, callback);
}