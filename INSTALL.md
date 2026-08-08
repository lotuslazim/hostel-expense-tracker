# BachelorBite Meal + Activity Audit v9

এই bundle-এর সব file project root-এ একই path ধরে copy/replace করতে হবে। Partial copy করলে meal/expense write Firestore Rules-এ reject হতে পারে।

## কী যোগ হয়েছে

- একই member + date + meal type শুধু একবার submit করা যাবে।
- একসঙ্গে একাধিক আলাদা meal type submit করা যাবে।
- Meal ও expense-এর Undo window ১০ সেকেন্ড। Undo পুরোনো activity মুছে না দিয়ে নতুন history row যোগ করে।
- সব active group member `/activity` page-এ shared history দেখতে পারবে।
- শুধু admin যেকোনো member-এর meal count বা item name ঠিক করতে পারবে। ৫–২০০ character কারণ বাধ্যতামূলক এবং সবার Activity Log-এ দেখা যাবে।
- User Manual-এ duplicate rule, Undo, Activity Log এবং admin correction যোগ হয়েছে।
- Firestore-এর বর্তমান `purchases` path এবং পুরোনো `purchasedItems` alias—দুটিই Rules-এ রাখা হয়েছে।

## Install

1. ZIP extract করে এর ভেতরের `firestore.rules` এবং `src` folder project root-এর একই path-এ copy/replace করো।
2. Project root-এর terminal-এ চালাও:

```powershell
npm run build
firebase use
firebase deploy --only firestore:rules
npm run dev
```

`firebase deploy` শেষে `Deploy complete!` না আসা পর্যন্ত production-এ নতুন flow কাজ করবে না।

## দ্রুত যাচাই

দুইটি test account দিয়ে:

1. একই date-এ Breakfast একবার log করো। দ্বিতীয়বার Breakfast disabled/rejected হওয়া উচিত।
2. নতুন meal log করার ১০ সেকেন্ডের মধ্যে Undo করো; তারপর একই meal আবার log করা উচিত।
3. অন্য member দিয়ে Activity Log খুলে meal add/undo এবং expense add/undo দেখা যাচ্ছে কি না দেখো।
4. Admin দিয়ে একটি member meal Correct করো। Reason ছাড়া save হওয়া উচিত নয়; reason-সহ correction সবার log-এ দেখা উচিত।

## Compatibility note

আগে database-এ তৈরি হওয়া duplicate meal এই patch নিজে থেকে delete বা merge করবে না। নতুন deterministic meal ID ভবিষ্যতের duplicate বন্ধ করবে। পুরোনো meal records admin correction list-এ থাকবে এবং admin reason-সহ ঠিক করতে পারবে।
