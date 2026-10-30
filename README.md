# 12 Tails · สมุดราคาไอเท็ม

เว็บบันทึกไอเท็ม 12 หาง สำหรับคุณกับแฟน ใช้ **React + Vite / Supabase / Netlify**

- รูปไอเท็มขนาดเล็ก ชื่อ รายละเอียด ราคา Gold และเงินบาท
- เพิ่ม แก้ไข ลบ อัปเดตราคา ค้นหาชื่อไทย/อังกฤษ และเรียงราคา
- **ทุกคนที่มีลิงก์ดูได้** รวมถึงแฟน โดยไม่ต้องมีบัญชี (ไม่ใช่บอร์ดส่วนตัวแบบเชิญเท่านั้น)
- มีเพียงบัญชีเจ้าของที่อนุญาตในฐานข้อมูลเท่านั้นที่แก้ไขได้
- ใช้ได้ทั้งมือถือและคอมพิวเตอร์ ไม่ต้องดูแลเซิร์ฟเวอร์แยก
- ราคาแต่ละสกุลกรอกเอง ไม่มีการคำนวณอัตราแลกเปลี่ยนอัตโนมัติ

> Source Code พร้อมติดตั้ง แต่ยังไม่ได้เชื่อมบัญชี Supabase หรือ deploy Netlify ให้คุณ การเปิดเว็บโดยไม่ตั้งค่าจะแสดง **โหมดตัวอย่างอ่านอย่างเดียว** ชื่อและราคาในตัวอย่างเป็นข้อมูลสมมติ ไม่ใช่ราคาตลาดจริง

## 1. เตรียมบัญชี

1. สมัครหรือเข้าสู่ [Supabase](https://supabase.com/dashboard) และ [Netlify](https://app.netlify.com/)
2. ใช้ GitHub repo นี้: [Mikesukami/12tails-items](https://github.com/Mikesukami/12tails-items)
3. ถ้าต้องการลองบนเครื่อง ให้ติดตั้ง [Node.js](https://nodejs.org/) รุ่น 22.13 ขึ้นไป พร้อม npm และ Git (ถ้าใช้ Windows ให้เลือกติดตั้ง PATH แล้วเปิด Terminal ใหม่)

ไม่ต้องส่งรหัสผ่านหรือ secret key ในแชต ขั้นตอนทั้งหมดด้านล่างทำในบัญชีของคุณเอง

## 2. สร้างฐานข้อมูล Supabase

1. กด **New project** ตั้งชื่อ `12tails-items`
2. ตั้งรหัสผ่านฐานข้อมูลและเก็บไว้ เลือก region ใกล้ประเทศไทย เช่น Singapore หากมีให้เลือก
3. รอโปรเจกต์พร้อมใช้งาน
4. เข้า **SQL Editor → New query**
5. เปิดไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ใน repo คัดลอก **ทั้งไฟล์** วางใน SQL Editor แล้วกด **Run**
6. สคริปต์สร้างตาราง `items`, ตารางสิทธิ์ `admin_users`, กฎ RLS และ bucket `item-images` ให้ครบแล้ว **ไม่ต้องสร้าง bucket เอง**

สคริปต์นี้ใช้กับโปรเจกต์ใหม่และรันครั้งเดียว หากรันซ้ำแล้วแจ้งว่าตารางมีอยู่ ไม่ต้องลบข้อมูลหรือรันใหม่ ให้ตรวจใน Table Editor ก่อน หากสคริปต์ล้มเหลว คำสั่งอยู่ใน transaction เดียวจึงไม่ควรเหลือการสร้างบางส่วน

## 3. สร้างบัญชีเจ้าของและให้สิทธิ์

1. เข้า **Authentication → Users → Add user → Create new user**
2. ใส่อีเมลคุณและรหัสผ่านที่แข็งแรง เลือก **Auto Confirm User** หากมีตัวเลือก เพื่อให้เข้าสู่ระบบได้ทันที
3. คัดลอก **User UID** ของบัญชีที่เพิ่งสร้าง (เป็น UUID)
4. กลับ SQL Editor เปิด query ใหม่ แล้วรัน โดยแทนที่ข้อความระหว่างเครื่องหมาย `'` ด้วย UID จริง:

```sql
insert into public.admin_users(user_id)
values ('YOUR_OWNER_USER_UID')
on conflict do nothing;
```

5. เข้า **Authentication → Sign In / Providers → Email** (ชื่อเมนูอาจเปลี่ยนตาม Dashboard) ปิด **Allow new users to sign up** / การสมัครสมาชิกใหม่ ไม่ต้องปิดการเข้าสู่ระบบด้วย Email
6. แฟนไม่ต้องมีบัญชี ส่งลิงก์เว็บให้เปิดดูได้เลย

สิทธิ์เจ้าของตรวจจาก UID ใน `admin_users` ที่ฐานข้อมูล การซ่อนปุ่มในหน้าเว็บเป็นเพียงส่วนแสดงผล บัญชีทั่วไปไม่มีสิทธิ์แก้ไขแม้เรียก API เอง ผู้ใช้ไม่สามารถเพิ่มตัวเองเป็นเจ้าของได้

หากวันหลังต้องการให้แฟนแก้ไขด้วย ให้สร้างบัญชีแฟนและเพิ่ม UID ด้วยคำสั่งเดียวกัน การถอนสิทธิ์ใช้ `delete from public.admin_users where user_id = 'UID';` แล้วให้ออกจากระบบและเข้าใหม่

## 4. คัดลอกค่าที่หน้าเว็บต้องใช้

ใน Supabase เปิด **Connect** หรือ **Project Settings → API / API Keys** หา:

| ชื่อในเว็บนี้ | ค่าจาก Supabase |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL เช่น `https://abcdefgh.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Publishable key** (`sb_publishable_...`) หรือ legacy **anon public key** |

สองค่านี้เป็นค่าฝั่งหน้าเว็บ และผู้เปิดเว็บสามารถเห็นได้ตามปกติ การป้องกันสิทธิ์ใช้ RLS ที่ตั้งไว้แล้ว **ห้ามใช้ secret key (`sb_secret_...`), `service_role` หรือรหัสผ่านฐานข้อมูลในตัวแปร `VITE_`**

## 5. ลองบนเครื่อง (ข้ามได้ถ้าจะ deploy ผ่าน GitHub เลย)

เปิด Terminal ในโฟลเดอร์โปรเจกต์ เช่น `D:\item-12tails`:

```powershell
npm install
Copy-Item .env.example .env
```

เปิด `.env` ในโปรแกรมแก้ไขข้อความแล้วใส่สองค่าจริง:

```dotenv
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_YOUR_KEY
```

จากนั้น:

```powershell
npm run dev
```

เปิดลิงก์ที่ Terminal แสดง ปกติเป็น `http://127.0.0.1:5173` หากเปลี่ยน `.env` ให้หยุดด้วย Ctrl+C แล้วเริ่มใหม่ ไฟล์ `.env` ถูกกันไว้ไม่ให้ commit

โปรเจกต์มี `pnpm-lock.yaml` สำหรับติดตั้งเวอร์ชันตรงกัน หากต้องการใช้ pnpm บนเครื่อง: `npm install -g pnpm@11.25.0` แล้ว `pnpm install --frozen-lockfile`, `pnpm dev` ได้เช่นกัน ไม่จำเป็นต้องติดตั้งทั้ง npm และ pnpm dependencies ซ้ำ

## 6. นำขึ้น Netlify ผ่าน GitHub (แนะนำ)

1. เข้า Netlify → **Add new project / Import an existing project → GitHub**
2. อนุญาต Netlify เข้าถึง repo `Mikesukami/12tails-items` แล้วเลือก repo
3. เลือก branch **main**
4. ตรวจค่าต่อไปนี้ (มี `netlify.toml` ให้แล้ว):
   - Base directory: เว้นว่าง
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node.js: `22` (ตั้งไว้ในไฟล์แล้ว)
5. ในขั้นตั้งค่าหรือ **Project configuration → Environment variables** เพิ่ม `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY` ตามข้อ 4 ให้ใช้กับ **Builds / Production**
6. กด **Deploy** รอจนสถานะ **Published / Production** สำเร็จ
7. เปิดลิงก์ `https://ชื่อเว็บ.netlify.app` ถ้ายังแสดงโหมดตัวอย่างให้ตรวจชื่อตัวแปรและค่าจริง แล้ว **Trigger deploy → Deploy project** ใหม่ การเปลี่ยน environment variable ต้อง build ใหม่เสมอ
8. กลับ Supabase → **Authentication → URL Configuration** ตั้ง **Site URL** เป็นลิงก์ Netlify ของคุณ แล้ว Save
9. เปิดเว็บ → **เข้าสู่ระบบเจ้าของ** → ใส่อีเมลและรหัสผ่านจากข้อ 3 → **เพิ่มไอเท็ม**
10. ส่งลิงก์เดียวกันให้แฟน แฟนค้นหาและเรียงราคาได้โดยไม่ต้องเข้าสู่ระบบ

Netlify จะตรวจ `pnpm-lock.yaml` และ `packageManager` เพื่อติดตั้งด้วย pnpm ที่ระบุโดยอัตโนมัติ ส่วน build command ใช้ npm เรียกสคริปต์ได้ตามปกติ หาก build log บอกว่า pnpm ไม่พร้อม ให้เปิด Corepack ในการตั้งค่า build หรือดู [คู่มือจัดการ dependencies ของ Netlify](https://docs.netlify.com/build/configure-builds/manage-dependencies/)

### ทางเลือก: อัปโหลด dist โดยตรง

หลังตั้ง `.env` บนเครื่องแล้ว รัน `npm run build` นำ **โฟลเดอร์ `dist`** ไปวางในหน้าสร้างเว็บแบบ Manual deploy ของ Netlify ห้ามอัปโหลดทั้ง Source Code แทน `dist` วิธีนี้ค่าฐานข้อมูลถูกฝังตอน build บนเครื่อง เปลี่ยนค่าแล้วต้อง build และอัปโหลดใหม่เอง

## 7. ตรวจการใช้งานจริงก่อนเริ่มจดราคา

1. เข้าสู่ระบบเจ้าของ เพิ่มไอเท็มพร้อมรูป PNG/JPG/WebP ไม่เกิน 2 MB และใส่ราคาทั้งสองสกุล
2. รีโหลดหน้าเว็บ ไอเท็มและรูปต้องยังอยู่
3. แก้ราคาและรายละเอียด บันทึกแล้วตรวจว่าราคาที่แก้แสดงทันที
4. เปิดเว็บในหน้าต่างไม่ระบุตัวตนหรือมือถือของแฟน ต้องเห็นไอเท็ม ค้นหาได้ และ **ไม่มีปุ่มเพิ่ม/แก้ไข/ลบ**
5. เมื่อคุณแก้ราคา แฟนกด **รีเฟรช** เพื่อดึงข้อมูลล่าสุด (ระบบไม่ได้เปิดอัปเดตแบบเรียลไทม์)
6. ลองลบไอเท็มทดสอบ จะมีคำยืนยันก่อนลบ
7. ใน SQL Editor รัน [`supabase/verify-rls.sql`](supabase/verify-rls.sql) หลังเพิ่มเจ้าของแล้ว สคริปต์ตรวจสิทธิ์จริงและ rollback แถวทดสอบทั้งหมด ควรแสดง `PASS` ในส่วนข้อความโดยไม่มี error หากเกิด error ให้รัน `rollback;` ก่อนเริ่ม query ถัดไป

โค้ดผ่านการทดสอบในเครื่องได้ด้วย `npm test` และสร้างเว็บด้วย `npm run build` แต่การเชื่อมต่อ Auth, Storage และ RLS จริงต้องตรวจในโปรเจกต์ Supabase ของคุณตามรายการนี้ ไม่มีการอ้างว่าทดสอบบริการจริงก่อนเชื่อมบัญชี

## รูปภาพและข้อมูล

- รูปเป็นไฟล์ใน Supabase Storage ข้อมูลไอเท็มเป็นแถวใน PostgreSQL ไม่ได้เก็บไว้เฉพาะเครื่อง
- รองรับ JPG, PNG, WebP ขนาดไม่เกิน 2 MiB มีการตรวจทั้งหน้าเว็บและ bucket
- เปลี่ยนรูปจะอัปโหลดไฟล์ชื่อใหม่ เมื่อบันทึกข้อมูลสำเร็จจึงลบรูปเดิม หากลบไฟล์เก่าไม่สำเร็จจะแจ้งเตือนโดยไม่ทำให้ข้อมูลที่บันทึกแล้วหาย
- ถ้าอัปโหลดสำเร็จแต่ผู้ใช้ปิดหน้าต่างก่อนบันทึกเสร็จ อาจมีไฟล์ตกค้างใน Storage ให้ตรวจเทียบ `items.image_path` ก่อนลบไฟล์ที่ไม่ได้ใช้
- ราคาอยู่ในช่วง 0–999,999,999,999.99 ทศนิยมไม่เกินสองตำแหน่ง ใส่ `0` ได้ ต้องใส่ทั้งสองสกุล
- หากแก้ไอเท็มเดียวกันจากสองหน้าต่าง ค่าที่บันทึกสำเร็จครั้งหลังเป็นค่าปัจจุบัน
- ไม่มีประวัติราคาย้อนหลัง ไม่มีปุ่มกู้คืนหลังลบ แนะนำ export ตาราง `items` และดาวน์โหลดรูปสำรองเป็นระยะจาก Dashboard
- บอร์ดและรูปเป็นข้อมูลที่คนมีลิงก์เข้าถึงได้ อย่าใส่ข้อมูลส่วนตัวที่ต้องการจำกัดให้เห็นเฉพาะสองคน

## แก้ปัญหาที่พบบ่อย

| อาการ | วิธีตรวจ |
| --- | --- |
| เห็นโหมดตัวอย่าง | ตัวแปรสองค่าหาย/ยังเป็น placeholder หรือยังไม่ได้ build ใหม่ |
| เข้าสู่ระบบไม่ได้ | ตรวจอีเมล/รหัสผ่านและสถานะยืนยันบัญชีใน Authentication |
| เข้าได้แต่ไม่มีปุ่มเพิ่ม | ตรวจว่า UID ที่ใส่ใน `admin_users` ตรงกับบัญชี แล้วออก/เข้าใหม่ |
| โหลดข้อมูลไม่สำเร็จ | ตรวจ Project URL, public key, การรัน schema และสถานะโปรเจกต์ Supabase |
| `row-level security policy` | ตรวจ UID เจ้าของ และรันสคริปต์ verify-rls ห้ามแก้ด้วยการปิด RLS |
| รูปอัปโหลดไม่ได้ | ตรวจชนิด/ขนาดรูป bucket `item-images` และสิทธิ์เจ้าของ |
| แฟนเห็นราคาเก่า | กดรีเฟรชบนหน้าเว็บหรือ reload หน้า |
| Netlify build ไม่ผ่าน | ดู Deploy log, ตรวจ Node 22, dependencies และ publish directory `dist` |

หากเปลี่ยนไปใช้ Supabase custom domain ให้ปรับ `Content-Security-Policy` ใน `netlify.toml` ให้ยอมรับโดเมนนั้นด้วย ค่าเริ่มต้นรองรับโดเมนมาตรฐาน `*.supabase.co`

## โครงสร้าง Source Code

```text
src/App.jsx             บอร์ด การค้นหา การจัดการสิทธิ์และหน้าต่าง
src/ItemEditor.jsx      ฟอร์มเพิ่ม/แก้ไขและเลือกภาพ
src/Login.jsx           การเข้าสู่ระบบเจ้าของ
src/repository.js       ติดต่อฐานข้อมูลและ Storage
src/domain.js           ตรวจราคา รูป และค้นหา/เรียง
src/client.js           ตั้งค่าการเชื่อมต่อจาก environment
src/styles.css          หน้าตาเว็บและมือถือ
supabase/schema.sql     ติดตั้งตารางและสิทธิ์
supabase/verify-rls.sql  ตรวจสิทธิ์บนฐานข้อมูลจริง
tests/                  ทดสอบกติกา การบันทึก และการใช้งานหน้าจอ
netlify.toml            ตั้งค่า build และ HTTP headers
```

## เอกสารทางการที่ใช้อ้างอิง

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Netlify: Vite](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Netlify: environment variables](https://docs.netlify.com/build/environment-variables/get-started/)

ชื่อเมนูและเงื่อนไขแพ็กเกจของบริการอาจเปลี่ยนได้ ให้ตรวจ Dashboard ตอนสมัคร ไม่มีการซื้อแพ็กเกจหรือเปิดบริการเสียเงินให้โดยอัตโนมัติ
