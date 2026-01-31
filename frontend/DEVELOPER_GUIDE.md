# دليل المطور (Developer Guide)
> "نظام متماسك، كود نظيف، صيانة سهلة"

يوضح هذا الدليل المعايير المتبعة في تطوير الواجهة الأمامية لنظام (TBA WAAD System). يجب الالتزام بهذه المعايير لضمان جودة الكود وسهولة الصيانة.

## 1. هيكلية المجلدات (Folder Structure)

تم تنظيم المشروع ليفصل بوضوح بين المكونات، الخدمات، والصفحات:
- `src/components/tba`: المكونات القياسية للنظام. استخدمها دائماً بدلاً من بناء مكونات من الصفر.
- `src/hooks/factories`: المصانع (Factories) التي تولد الـ Hooks تلقائياً.
- `src/pages`: صفحات النظام، مقسمة حسب الوحدات (Modules).

## 2. معايير واجهة المستخدم (UI Standards)

### أ. ترويسة الصفحة (`ModernPageHeader`)
استخدم هذا المكون في بداية كل صفحة لضمان شكل موحد.
```javascript
<ModernPageHeader
  title="عنوان الصفحة"
  subtitle="وصف قصير"
  icon={IconComponent}
  breadcrumbs={[{ label: 'الرئيسية', path: '/' }, { label: 'الصفحة الحالية' }]}
  actions={<Button>إجراء إضافي</Button>} // اختياري
/>
```

### ب. جداول البيانات (`GenericDataTable`)
لا تقم ببناء الجداول يدوياً. استخدم هذا المكون الذي يدعم الترتيب والتحميل تلقائياً.
```javascript
<GenericDataTable
  columns={columns}
  data={data.items}
  totalCount={data.total}
  isLoading={loading}
  tableState={tableState}
  enablePagination={true}
/>
```

---

## 3. معيار جلب البيانات (Data Fetching Standard)

نستخدم `Resource Hook Factory` لتوليد دوال التعامل مع البيانات تلقائياً، مدعومة بـ `React Query` للكاش.

### كيفية إضافة مورد جديد (Example: Medical Services)

1.  **أنشئ ملف الخدمة (`medical-services.service.js`):**
    يجب أن يحتوي على دوال API الأساسية (`getMedicalServices`, `getMedicalServiceById`, `create...`, `update...`, `delete...`).

2.  **أنشئ ملف الـ Hook (`useMedicalServices.js`):**
    استخدم المصنع لتوليد الـ Hooks.

```javascript
import { createResourceHooks } from './factories/createResourceHooks';
import * as service from 'services/api/medical-services.service';

const { 
    useList: useMedicalServicesList, 
    useDetails: useMedicalServiceDetails, 
    useCreate: useCreateMedicalService,
    // ...
} = createResourceHooks({
    queryKey: 'medical-services', // مفتاح الكاش الفريد
    service: service,
    methods: {
        list: 'getMedicalServices', // اسم الدالة في ملف الخدمة
        details: 'getMedicalServiceById',
        create: 'createMedicalService',
        update: 'updateMedicalService',
        delete: 'deleteMedicalService'
    }
});

export { useMedicalServicesList, useMedicalServiceDetails, ... };
```

3.  **استخدم الـ Hook في الصفحة:**

```javascript
const { data, isLoading } = useMedicalServicesList(params);
const { mutate: createService } = useCreateMedicalService();
```

---

## 4. الفائدة التقنية (Why?)
-   **الكاش (Caching):** البيانات لا تُجلب مرتين بفضل React Query.
-   **التناسق (Consistency):** جميع الصفحات تتصرف بنفس الطريقة.
-   **السرعة (Speed):** إضافة صفحة جديدة لا تتطلب كتابة `useEffect` أو `axios` مرة أخرى.
