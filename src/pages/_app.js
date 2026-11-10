import React from "react";
import {Toaster} from "react-hot-toast";
import {Layout} from "../components";
import "../styles/globals.css"; /* common page elements */

import "../styles/login.css"
import "../styles/patients.css";
import "../styles/dashboard.css";
import "../styles/prescribeOrder.css";
import "../styles/perfusionSheet.css";
import "../styles/volumesPerDay.css";


import "../styles/index.scss";  /* main styles */
import "../styles/overrides/portable.css"; /* override tablet styles for portrait */

import { StateContext } from "../../context/StateContext";
import { DefaultSeo } from "next-seo";
import SEO from "../../next-seo.config";

function MyApp({ Component, pageProps }) {
  
  //const noLayout = Component.noLayout;

return (
  <>
    <DefaultSeo
      {...SEO}
      title="Next SEO Example"
      description="Next SEO is a plug in that makes managing your SEO easier in Next.js projects."
      twitter={{
        handle: "@handle",
        site: "@site",
        cardType: "summary_large_image",
      }}
    />
    
    <StateContext>
      <Layout>
        <Toaster />
        <Component {...pageProps} />;
      </Layout>
    </StateContext>
  </>

);
}
export default MyApp;
