import React, { useEffect } from "react";

const GoogleTranslate = () => {

  useEffect(() => {

    // Default Language English
    if (!localStorage.getItem("selectedLanguage")) {
      localStorage.setItem("selectedLanguage", "en");
    }

    const savedLang = localStorage.getItem("selectedLanguage");

    document.cookie = `googtrans=/en/${savedLang};path=/`;
    document.cookie = `googtrans=/en/${savedLang};domain=${window.location.hostname};path=/`;

    window.googleTranslateElementInit = () => {

      if (
        window.google &&
        window.google.translate &&
        document.getElementById("google_translate_element")
      ) {

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages:
              "en,hi,bn,te,ta,mr,gu,kn,ml",
            autoDisplay: false,
          },
          "google_translate_element"
        );

      }
    };

    if (!document.getElementById("google-translate-script")) {

      const script = document.createElement("script");

      script.id = "google-translate-script";

      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

      script.async = true;

      document.body.appendChild(script);

    }

  }, []);

  return <div id="google_translate_element"></div>;
};

export default GoogleTranslate;