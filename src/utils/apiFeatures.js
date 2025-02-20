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
