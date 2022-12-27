const axios = require("axios");

async function fetcher(instance) {
  const response = await axios(instance)
      .then((res) => res.data)
      .catch((error) => error);

  return response;
}

module.exports = {fetcher};
