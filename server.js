const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require("axios");

const getFromDataFromFillout = async (formId) => {
  // Fillout API Info (TODO: If have additional time will store in the cloud)
  const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
  const apiKey =
    "sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912";

  // config to request form data from fillout API
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: apiUrl,
    headers: {
      Authorization: "Bearer " + apiKey,
    },
  };
  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// use for query quailft all filter condition submissions
const filteredResponsesByFilters = (dataArray, filters) => {
  const parsedDataArray = JSON.parse(dataArray);

  return parsedDataArray.filter((submission) => {
    const questionsArray = submission.questions;

    return filters.every((filter) => {
      // Check if the filter condition is satisfied for at least one question
      return questionsArray.some((dataItem) => {
        if (filter.id === dataItem.id) {
          const dataValue =
            dataItem.type === "DatePicker"
              ? new Date(dataItem.value)
              : dataItem.value;
          const filterValue =
            dataItem.type === "DatePicker"
              ? new Date(filter.value)
              : filter.value;

          switch (filter.condition) {
            case "equals":
              return dataValue === filterValue;
            case "greater_than":
              return dataValue > filterValue;
            case "does_not_equal":
              return dataValue !== filterValue;
            case "less_than":
              return dataValue < filterValue;
            default:
              return false; // Default to false if condition is not recognized
          }
        }
        return false; // Default to false if no matching question is found
      });
    });
  });
};

// Here is our filter response API endpoint
app.get("/:formId/filteredResponses", async (req, res) => {
  const formId = req.params.formId;
  // filter formta like this:
  //   [{
  //       id: "bE2Bo4cGUv49cjnqZ4UnkW",
  //       condition: "equals",
  //       value: "Johnny",
  //     },
  //     {
  //       id: "dSRAe3hygqVwTpPK69p5td",
  //       condition: "greater_than",
  //       value: "2024-01-23T05:01:47.691Z",
  //     },
  //   ]
  const filters = JSON.parse(JSON.stringify(req.query.filters));
  // logic for fetching and filtering responses goes here
  try {
    const response = await getFromDataFromFillout(formId);
    const filterSubmissions = filteredResponsesByFilters(
      JSON.stringify(response.responses),
      filters
    );

    res.json({
      message: `Fetching responses for form ID ${formId} with filters`,
      filters: req.query.filters,
      responses: filterSubmissions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
