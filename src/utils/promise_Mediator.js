/**
 * Lắng nghe các sự kiện mediator và trả về một Promise.
 *
 * @param {string} resultEventName Tên sự kiện được phát ra khi thành công.
 * @param {string} errorEventName Tên sự kiện được phát ra khi có lỗi.
 * @param {EventEmitter} mediator Đối tượng mediator.
 * @returns {Promise<any>} Một Promise giải quyết với kết quả hoặc reject với lỗi.
 */

const getDataFromPromiss = async (
  resultEventName,
  errorEventName,
  mediator
) => {
  const createAppointmentPromise = new Promise((resolve, reject) => {
    mediator.once(resultEventName, (result) => {
      resolve(result);
    });
    mediator.once(errorEventName, (error) => {
      reject(error);
    });
  });
  return await createAppointmentPromise;
};

module.exports = getDataFromPromiss;
