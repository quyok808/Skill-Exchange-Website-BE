class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query
    this.queryString = queryString; // req.query
    this.mongoQuery = {};
  }

  filter() {
    const queryObj = { ...this.queryString }; // Tạo một bản sao của queryString

    // Loại bỏ các trường dành riêng cho phân trang, sắp xếp, ...
    const excludedFields = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let mongoQuery = {}; // Query mặc định (không có điều kiện)

    if (queryObj.name) {
      mongoQuery.name = { $regex: queryObj.name, $options: "i" }; // Tìm kiếm gần đúng (không phân biệt chữ hoa/thường)
    }
    if (queryObj.email) {
      mongoQuery.email = { $regex: queryObj.email, $options: "i" }; // Tìm kiếm gần đúng (không phân biệt chữ hoa/thường)
    }

    this.mongoQuery = mongoQuery; // Lưu lại mongoQuery để đếm tổng số
    this.query = this.query.find(mongoQuery); // Thêm điều kiện tìm kiếm

    return this; // Để chaining methods
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" "); // Chuyển đổi "price,-createdAt" thành "price -createdAt"
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Sắp xếp mặc định theo createdAt giảm dần
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;

    return this;
  }
}

module.exports = APIFeatures;
