// import React from 'react';
// import { useTranslation } from 'react-i18next';

// const LanguageSwitcher = () => {
//   const { i18n } = useTranslation();

//   const changeLanguage = (e) => {
//     i18n.changeLanguage(e.target.value);
//   };

//   return (
//     <select onChange={changeLanguage} value={i18n.language}>
//       <option value="en">English</option>
//       <option value="hi">हिंदी</option>
//       <option value="bn">বাংলা</option>
//       <option value="te">తెలుగు</option>
//       <option value="ta">தமிழ்</option>
//       <option value="mr">मराठी</option>
//       <option value="gu">ગુજરાતી</option>
//       <option value="kn">ಕನ್ನಡ</option>
//       <option value="ml">മലയാളം</option>
//     </select>
//   );
// };

// export default LanguageSwitcher;
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  // ✅ CORRECT: The hook is INSIDE the component function
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select 
      onChange={changeLanguage} 
      value={i18n.language}
      style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
    >
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="bn">বাংলা</option>
      <option value="te">తెలుగు</option>
      <option value="ta">தமிழ்</option>
      <option value="mr">मराठी</option>
      <option value="gu">ગુજરાતી</option>
      <option value="kn">ಕನ್ನಡ</option>
      <option value="ml">മലയാളം</option>
    </select>
  );
};

export default LanguageSwitcher;