class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query
    this.queryString = queryString; // req.query
  }

  filter() {
    // Logic để lọc dựa trên req.query
    return this; // Để chaining methods
  }

  sort() {
    // Logic để sắp xếp
    return this;
  }

  paginate() {
    // Logic để phân trang
    return this;
  }
}

module.exports = APIFeatures;
