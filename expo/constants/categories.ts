export interface Category {
  id: string;
  uz: string;
  ru: string;
}

export const categories: Category[] = [
  { id: 'xalat', uz: 'Xalat', ru: 'Халат' },
  { id: 'pijama', uz: 'Pijama', ru: 'Пижама' },
  { id: 'koylak', uz: "Ko'ylak", ru: 'Рубашка' },
  { id: 'futbolka', uz: 'Futbolka', ru: 'Футболка' },
  { id: 'shim', uz: 'Shim', ru: 'Брюки' },
  { id: 'ichki_kiyim', uz: 'Ichki kiyim', ru: 'Нижнее бельё' },
  { id: 'sochiq', uz: 'Sochiq', ru: 'Полотенце' },
  { id: 'choyshablar', uz: 'Choyshablar', ru: 'Постельное бельё' },
];
