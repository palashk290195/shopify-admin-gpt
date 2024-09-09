import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  TextField,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function processNaturalLanguageCommand(command, products) {
  console.log("processNaturalLanguageCommand called with:", { command, products });
  try {
    console.log("Sending request to OpenAI");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": "You are a helpful assistant that interprets commands to update product titles and generate SEO-friendly descriptions. Given a list of products and a command, identify the product being referred to and suggest a new title and SEO-based description based on the command. Respond with a JSON object containing 'productTitle' (the current title of the product to be updated), 'newTitle' (the suggested new title), and 'newDescription' (the SEO-friendly product description)."
        },
        {
          "role": "user",
          "content": `Products: ${JSON.stringify(products.map(p => p.title))}\n\nCommand: ${command}`
        }
      ]
    });

    console.log("OpenAI response received:", completion);
    console.log("OpenAI response content:", completion.choices[0].message.content);

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
      console.log("Parsed OpenAI result:", result);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error(`Invalid JSON response from OpenAI: ${completion.choices[0].message.content}`);
    }

    const product = products.find(p => p.title.toLowerCase() === result.productTitle.toLowerCase());
    console.log("Found product:", product);

    if (!product) {
      throw new Error(`Product not found: ${result.productTitle}`);
    }

    return {
      productId: product.id,
      newTitle: result.newTitle,
      newDescription: result.newDescription, // Added new description to return
    };
  } catch (error) {
    console.error("Error in processNaturalLanguageCommand:", error);
    throw error;
  }
}

async function updateProductTitleAndDescription(admin, productId, newTitle, newDescription) {
  console.log("updateProductTitleAndDescription called with:", { productId, newTitle, newDescription });
  try {
    const response = await admin.graphql(
      `#graphql
        mutation updateProduct($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
              descriptionHtml
            }
          }
        }`,
      {
        variables: {
          input: {
            id: productId,
            title: newTitle,
            descriptionHtml: newDescription, // Update description along with title
          },
        },
      }
    );

    const responseJson = await response.json();
    console.log("Product update response:", responseJson);
    return responseJson.data.productUpdate.product;
  } catch (error) {
    console.error("Error in updateProductTitleAndDescription:", error);
    throw error;
  }
}

export const loader = async ({ request }) => {
  console.log("Loader function called");
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        products(first: 10) {
          edges {
            node {
              id
              title
              descriptionHtml
            }
          }
        }
      }`
  );

  const responseJson = await response.json();
  const products = responseJson.data.products.edges.map(({ node }) => node);
  console.log("Loaded products:", products);
  return json({ products });
};

export const action = async ({ request }) => {
  console.log("Action function called");
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const command = formData.get("command");
  const products = JSON.parse(formData.get("products"));

  console.log("Action received:", { command, products });

  try {
    console.log("Calling processNaturalLanguageCommand");
    const { productId, newTitle, newDescription } = await processNaturalLanguageCommand(command, products);
    console.log("processNaturalLanguageCommand result:", { productId, newTitle, newDescription });

    console.log("Calling updateProductTitleAndDescription");
    const updatedProduct = await updateProductTitleAndDescription(admin, productId, newTitle, newDescription);
    console.log("updateProductTitleAndDescription result:", updatedProduct);

    return json({ updatedProduct });
  } catch (error) {
    console.error("Error in action function:", error);
    return json({ error: error.message, stack: error.stack }, { status: 400 });
  }
};

export default function Index() {
  const { products } = useLoaderData();
  const [command, setCommand] = useState("");
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();

  const isUpdating = navigation.state === "submitting";

  useEffect(() => {
    console.log("Component rendered");
    console.log("Loaded products:", products);
  }, [products]);

  useEffect(() => {
    if (actionData) {
      console.log("Action data received:", actionData);
    }
  }, [actionData]);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Form submitted with command:", command);
    submit(
      { command, products: JSON.stringify(products) },
      { method: "post", replace: true }
    );
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Update Product Title and SEO Description with Natural Language
            </Text>
            {actionData?.error && (
              <Banner status="critical">
                <p>Error: {actionData.error}</p>
                {actionData.stack && (
                  <details>
                    <summary>Error Details</summary>
                    <pre>{actionData.stack}</pre>
                  </details>
                )}
              </Banner>
            )}
            {actionData?.updatedProduct && (
              <Banner status="success">
                Product updated: {actionData.updatedProduct.title}
                <br />
                New SEO Description: {actionData.updatedProduct.descriptionHtml}
              </Banner>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Enter your command"
                value={command}
                onChange={setCommand}
                placeholder="e.g., Change the snowboard title to 'Extreme Winter Glider' and improve the SEO description"
                autoComplete="off"
              />
              <Button submit disabled={isUpdating} loading={isUpdating}>
                Process Command
              </Button>
            </form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}