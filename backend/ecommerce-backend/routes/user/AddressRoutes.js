// file: routes/AddressRoutes.js
const BaseRoutes = require('../BaseRoutes');

class AddressRoutes extends BaseRoutes {
    constructor(addressController) {
        super('/api/diachi');
        this.addressController = addressController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.addressController;
        this.router.post('/them', c.add);
        this.router.put('/sua/:maDiaChi', c.update);
        this.router.delete('/xoa/:maDiaChi', c.remove);
        this.router.get('/:maKH', c.list);
    }
}

module.exports = AddressRoutes;
