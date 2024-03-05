const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const FILL_OUT_API_URL = "https://api.fillout.com/v1/api/forms";
const FILL_OUT_API_KEY =
  "sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912";

// Function to fetch form data from Fillout API
const getFormDataFromFillout = async (formId) => {
  const apiUrl = `${FILL_OUT_API_URL}/${formId}/submissions`;
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: apiUrl,
    headers: {
      Authorization: `Bearer ${FILL_OUT_API_KEY}`,
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

// Function to filter responses based on provided filters
const filteredResponsesByFilters = (dataArray, filters) => {
  const parsedDataArray = JSON.parse(dataArray);

  return parsedDataArray.filter((submission) =>
    filters.every((filter) =>
      submission.questions.some((dataItem) => {
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
              return false;
          }
        }
        return false;
      })
    )
  );
};

// Endpoint to filter responses based on form ID and provided filters
app.get("/:formId/filteredResponses", async (req, res) => {
  const formId = req.params.formId;
  // Parse filters from query string; default to an empty array if not provided
  const filters = req.query.filters
    ? JSON.parse(JSON.stringify(req.query.filters))
    : [];

  try {
    // Fetch form data from Fillout API
    const response = await getFormDataFromFillout(formId);
    // Filter responses based on provided filters
    const filterSubmissions = filteredResponsesByFilters(
      JSON.stringify(response.responses),
      filters
    );

    // Respond with filtered data
    res.json({
      message: `Fetching responses for form ID ${formId} with filters`,
      filters,
      responses: filterSubmissions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
