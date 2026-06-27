/**
 * Thai address hierarchy data for cascading dropdowns.
 * จังหวัด → อำเภอ/เขต → ตำบล/แขวง → รหัสไปรษณีย์
 */

export type SubDistrict = {
	name: string;
	postcode: string;
};

export type District = {
	name: string;
	subDistricts: SubDistrict[];
};

export type Province = {
	name: string;
	districts: District[];
};

export const THAI_ADDRESS_DATA: Province[] = [
	{
		name: 'กรุงเทพมหานคร',
		districts: [
			{
				name: 'เขตพระนคร',
				subDistricts: [
					{ name: 'พระบรมมหาราชวัง', postcode: '10200' },
					{ name: 'วังบูรพาภิรมย์', postcode: '10200' },
					{ name: 'วัดราชบพิธ', postcode: '10200' },
					{ name: 'สำราญราษฎร์', postcode: '10200' },
					{ name: 'ศาลเจ้าพ่อเสือ', postcode: '10200' },
					{ name: 'เสาชิงช้า', postcode: '10200' },
					{ name: 'บวรนิเวศ', postcode: '10200' },
					{ name: 'ตลาดยอด', postcode: '10200' },
					{ name: 'ชนะสงคราม', postcode: '10200' },
					{ name: 'บ้านพานถม', postcode: '10200' },
					{ name: 'บางขุนพรหม', postcode: '10200' },
					{ name: 'วัดสามพระยา', postcode: '10200' },
				],
			},
			{
				name: 'เขตดุสิต',
				subDistricts: [
					{ name: 'ดุสิต', postcode: '10300' },
					{ name: 'วชิรพยาบาล', postcode: '10300' },
					{ name: 'สวนจิตรลดา', postcode: '10300' },
					{ name: 'สี่แยกมหานาค', postcode: '10300' },
					{ name: 'ถนนนครไชยศรี', postcode: '10300' },
				],
			},
			{
				name: 'เขตหนองจอก',
				subDistricts: [
					{ name: 'กระทุ่มราย', postcode: '10530' },
					{ name: 'หนองจอก', postcode: '10530' },
					{ name: 'คลองสิบ', postcode: '10530' },
					{ name: 'คลองสิบสอง', postcode: '10530' },
					{ name: 'โคกแฝด', postcode: '10530' },
					{ name: 'คู้ฝั่งเหนือ', postcode: '10530' },
					{ name: 'ลำผักชี', postcode: '10530' },
					{ name: 'ลำต้อยติ่ง', postcode: '10530' },
				],
			},
			{
				name: 'เขตบางรัก',
				subDistricts: [
					{ name: 'มหาพฤฒาราม', postcode: '10500' },
					{ name: 'สีลม', postcode: '10500' },
					{ name: 'สุริยวงศ์', postcode: '10500' },
					{ name: 'บางรัก', postcode: '10500' },
					{ name: 'สี่พระยา', postcode: '10500' },
				],
			},
			{
				name: 'เขตบางเขน',
				subDistricts: [
					{ name: 'อนุสาวรีย์', postcode: '10220' },
					{ name: 'ท่าแร้ง', postcode: '10220' },
				],
			},
			{
				name: 'เขตบางกะปิ',
				subDistricts: [
					{ name: 'คลองจั่น', postcode: '10240' },
					{ name: 'หัวหมาก', postcode: '10240' },
				],
			},
			{
				name: 'เขตปทุมวัน',
				subDistricts: [
					{ name: 'รองเมือง', postcode: '10330' },
					{ name: 'วังใหม่', postcode: '10330' },
					{ name: 'ปทุมวัน', postcode: '10330' },
					{ name: 'ลุมพินี', postcode: '10330' },
				],
			},
			{
				name: 'เขตป้อมปราบศัตรูพ่าย',
				subDistricts: [
					{ name: 'ป้อมปราบ', postcode: '10100' },
					{ name: 'วัดเทพศิรินทร์', postcode: '10100' },
					{ name: 'คลองมหานาค', postcode: '10100' },
					{ name: 'บ้านบาตร', postcode: '10100' },
					{ name: 'วัดโสมนัส', postcode: '10100' },
				],
			},
			{
				name: 'เขตพระโขนง',
				subDistricts: [
					{ name: 'บางจาก', postcode: '10260' },
				],
			},
			{
				name: 'เขตมีนบุรี',
				subDistricts: [
					{ name: 'มีนบุรี', postcode: '10510' },
					{ name: 'แสนแสบ', postcode: '10510' },
				],
			},
			{
				name: 'เขตลาดกระบัง',
				subDistricts: [
					{ name: 'ลาดกระบัง', postcode: '10520' },
					{ name: 'คลองสองต้นนุ่น', postcode: '10520' },
					{ name: 'คลองสามประเวศ', postcode: '10520' },
					{ name: 'ลำปลาทิว', postcode: '10520' },
					{ name: 'ทับยาว', postcode: '10520' },
					{ name: 'ขุมทอง', postcode: '10520' },
				],
			},
			{
				name: 'เขตยานนาวา',
				subDistricts: [
					{ name: 'ช่องนนทรี', postcode: '10120' },
					{ name: 'บางโพงพาง', postcode: '10120' },
				],
			},
			{
				name: 'เขตสัมพันธวงศ์',
				subDistricts: [
					{ name: 'จักรวรรดิ', postcode: '10100' },
					{ name: 'สัมพันธวงศ์', postcode: '10100' },
					{ name: 'ตลาดน้อย', postcode: '10100' },
				],
			},
			{
				name: 'เขตพญาไท',
				subDistricts: [
					{ name: 'สามเสนใน', postcode: '10400' },
				],
			},
			{
				name: 'เขตธนบุรี',
				subDistricts: [
					{ name: 'วัดกัลยาณ์', postcode: '10600' },
					{ name: 'หิรัญรูจี', postcode: '10600' },
					{ name: 'บางยี่เรือ', postcode: '10600' },
					{ name: 'บุคคโล', postcode: '10600' },
					{ name: 'ตลาดพลู', postcode: '10600' },
					{ name: 'ดาวคะนอง', postcode: '10600' },
					{ name: 'สำเหร่', postcode: '10600' },
				],
			},
			{
				name: 'เขตบางกอกใหญ่',
				subDistricts: [
					{ name: 'วัดอรุณ', postcode: '10600' },
					{ name: 'วัดท่าพระ', postcode: '10600' },
				],
			},
			{
				name: 'เขตห้วยขวาง',
				subDistricts: [
					{ name: 'ห้วยขวาง', postcode: '10310' },
					{ name: 'บางกะปิ', postcode: '10310' },
					{ name: 'สามเสนนอก', postcode: '10310' },
				],
			},
			{
				name: 'เขตคลองสาน',
				subDistricts: [
					{ name: 'สมเด็จเจ้าพระยา', postcode: '10600' },
					{ name: 'คลองสาน', postcode: '10600' },
					{ name: 'บางลำภูล่าง', postcode: '10600' },
					{ name: 'คลองต้นไทร', postcode: '10600' },
				],
			},
			{
				name: 'เขตตลิ่งชัน',
				subDistricts: [
					{ name: 'คลองชักพระ', postcode: '10170' },
					{ name: 'ตลิ่งชัน', postcode: '10170' },
					{ name: 'ฉิมพลี', postcode: '10170' },
					{ name: 'บางพรม', postcode: '10170' },
					{ name: 'บางระมาด', postcode: '10170' },
					{ name: 'บางเชือกหนัง', postcode: '10170' },
				],
			},
			{
				name: 'เขตบางนา',
				subDistricts: [
					{ name: 'บางนาเหนือ', postcode: '10260' },
					{ name: 'บางนาใต้', postcode: '10260' },
				],
			},
			{
				name: 'เขตวัฒนา',
				subDistricts: [
					{ name: 'คลองเตยเหนือ', postcode: '10110' },
					{ name: 'คลองตันเหนือ', postcode: '10110' },
					{ name: 'พระโขนงเหนือ', postcode: '10110' },
				],
			},
			{
				name: 'เขตสาทร',
				subDistricts: [
					{ name: 'ทุ่งวัดดอน', postcode: '10120' },
					{ name: 'ยานนาวา', postcode: '10120' },
					{ name: 'ทุ่งมหาเมฆ', postcode: '10120' },
				],
			},
			{
				name: 'เขตบางซื่อ',
				subDistricts: [
					{ name: 'บางซื่อ', postcode: '10800' },
				],
			},
			{
				name: 'เขตจตุจักร',
				subDistricts: [
					{ name: 'ลาดยาว', postcode: '10900' },
					{ name: 'เสนานิคม', postcode: '10900' },
					{ name: 'จันทรเกษม', postcode: '10900' },
					{ name: 'จอมพล', postcode: '10900' },
					{ name: 'จตุจักร', postcode: '10900' },
				],
			},
			{
				name: 'เขตบางคอแหลม',
				subDistricts: [
					{ name: 'บางคอแหลม', postcode: '10120' },
					{ name: 'วัดพระยาไกร', postcode: '10120' },
					{ name: 'บางโคล่', postcode: '10120' },
				],
			},
			{
				name: 'เขตประเวศ',
				subDistricts: [
					{ name: 'ประเวศ', postcode: '10250' },
					{ name: 'หนองบอน', postcode: '10250' },
					{ name: 'ดอกไม้', postcode: '10250' },
				],
			},
			{
				name: 'เขตคลองเตย',
				subDistricts: [
					{ name: 'คลองเตย', postcode: '10110' },
					{ name: 'คลองตัน', postcode: '10110' },
					{ name: 'พระโขนง', postcode: '10110' },
				],
			},
			{
				name: 'เขตสวนหลวง',
				subDistricts: [
					{ name: 'สวนหลวง', postcode: '10250' },
					{ name: 'อ่อนนุช', postcode: '10250' },
					{ name: 'พัฒนาการ', postcode: '10250' },
				],
			},
			{
				name: 'เขตคันนายาว',
				subDistricts: [
					{ name: 'คันนายาว', postcode: '10230' },
					{ name: 'รามอินทรา', postcode: '10230' },
				],
			},
			{
				name: 'เขตสะพานสูง',
				subDistricts: [
					{ name: 'สะพานสูง', postcode: '10240' },
				],
			},
			{
				name: 'เขตวังทองหลาง',
				subDistricts: [
					{ name: 'วังทองหลาง', postcode: '10310' },
					{ name: 'สะพานสอง', postcode: '10310' },
					{ name: 'คลองเจ้าคุณสิงห์', postcode: '10310' },
					{ name: 'พลับพลา', postcode: '10310' },
				],
			},
			{
				name: 'เขตคลองสามวา',
				subDistricts: [
					{ name: 'สามวาตะวันตก', postcode: '10510' },
					{ name: 'สามวาตะวันออก', postcode: '10510' },
					{ name: 'บางชัน', postcode: '10510' },
					{ name: 'ทรายกองดิน', postcode: '10510' },
					{ name: 'ทรายกองดินใต้', postcode: '10510' },
				],
			},
			{
				name: 'เขตบางแค',
				subDistricts: [
					{ name: 'บางแค', postcode: '10160' },
					{ name: 'บางแคเหนือ', postcode: '10160' },
					{ name: 'บางไผ่', postcode: '10160' },
					{ name: 'หลักสอง', postcode: '10160' },
				],
			},
			{
				name: 'เขตลาดพร้าว',
				subDistricts: [
					{ name: 'ลาดพร้าว', postcode: '10230' },
					{ name: 'จรเข้บัว', postcode: '10230' },
				],
			},
			{
				name: 'เขตหลักสี่',
				subDistricts: [
					{ name: 'ทุ่งสองห้อง', postcode: '10210' },
					{ name: 'ตลาดบางเขน', postcode: '10210' },
				],
			},
			{
				name: 'เขตสายไหม',
				subDistricts: [
					{ name: 'สายไหม', postcode: '10220' },
					{ name: 'ออเงิน', postcode: '10220' },
					{ name: 'คลองถนน', postcode: '10220' },
				],
			},
			{
				name: 'เขตดอนเมือง',
				subDistricts: [
					{ name: 'สีกัน', postcode: '10210' },
				],
			},
			{
				name: 'เขตราชเทวี',
				subDistricts: [
					{ name: 'ทุ่งพญาไท', postcode: '10400' },
					{ name: 'ถนนพญาไท', postcode: '10400' },
					{ name: 'ถนนเพชรบุรี', postcode: '10400' },
					{ name: 'มักกะสัน', postcode: '10400' },
				],
			},
			{
				name: 'เขตบึงกุ่ม',
				subDistricts: [
					{ name: 'คลองกุ่ม', postcode: '10230' },
					{ name: 'นวมินทร์', postcode: '10230' },
					{ name: 'นวลจันทร์', postcode: '10230' },
				],
			},
			{
				name: 'เขตดินแดง',
				subDistricts: [
					{ name: 'ดินแดง', postcode: '10400' },
				],
			},
			{
				name: 'เขตภาษีเจริญ',
				subDistricts: [
					{ name: 'บางหว้า', postcode: '10160' },
					{ name: 'บางด้วน', postcode: '10160' },
					{ name: 'บางจาก', postcode: '10160' },
					{ name: 'บางแวก', postcode: '10160' },
					{ name: 'คลองขวาง', postcode: '10160' },
					{ name: 'ปากคลองภาษีเจริญ', postcode: '10160' },
					{ name: 'คูหาสวรรค์', postcode: '10160' },
				],
			},
			{
				name: 'เขตจอมทอง',
				subDistricts: [
					{ name: 'บางขุนเทียน', postcode: '10150' },
					{ name: 'บางค้อ', postcode: '10150' },
					{ name: 'บางมด', postcode: '10150' },
					{ name: 'จอมทอง', postcode: '10150' },
				],
			},
			{
				name: 'เขตบางขุนเทียน',
				subDistricts: [
					{ name: 'ท่าข้าม', postcode: '10150' },
					{ name: 'แสมดำ', postcode: '10150' },
				],
			},
			{
				name: 'เขตทวีวัฒนา',
				subDistricts: [
					{ name: 'ทวีวัฒนา', postcode: '10170' },
					{ name: 'ศาลาธรรมสพน์', postcode: '10170' },
				],
			},
			{
				name: 'เขตบางบอน',
				subDistricts: [
					{ name: 'บางบอน', postcode: '10150' },
				],
			},
			{
				name: 'เขตราษฎร์บูรณะ',
				subDistricts: [
					{ name: 'ราษฎร์บูรณะ', postcode: '10140' },
					{ name: 'บางปะกอก', postcode: '10140' },
				],
			},
			{
				name: 'เขตทุ่งครุ',
				subDistricts: [
					{ name: 'บางมด', postcode: '10140' },
					{ name: 'ทุ่งครุ', postcode: '10140' },
				],
			},
			{
				name: 'เขตบางพลัด',
				subDistricts: [
					{ name: 'บางพลัด', postcode: '10700' },
					{ name: 'บางอ้อ', postcode: '10700' },
					{ name: 'บางบำหรุ', postcode: '10700' },
					{ name: 'บางยี่ขัน', postcode: '10700' },
				],
			},
			{
				name: 'เขตหนองแขม',
				subDistricts: [
					{ name: 'หนองแขม', postcode: '10160' },
					{ name: 'หนองค้างพลู', postcode: '10160' },
				],
			},
		],
	},
	{
		name: 'นนทบุรี',
		districts: [
			{
				name: 'เมืองนนทบุรี',
				subDistricts: [
					{ name: 'สวนใหญ่', postcode: '11000' },
					{ name: 'ตลาดขวัญ', postcode: '11000' },
					{ name: 'บางเขน', postcode: '11000' },
					{ name: 'บางกระสอ', postcode: '11000' },
					{ name: 'ท่าทราย', postcode: '11000' },
					{ name: 'บางไผ่', postcode: '11000' },
					{ name: 'บางศรีเมือง', postcode: '11000' },
					{ name: 'บางกร่าง', postcode: '11000' },
					{ name: 'ไทรม้า', postcode: '11000' },
					{ name: 'บางรักน้อย', postcode: '11000' },
				],
			},
			{
				name: 'บางกรวย',
				subDistricts: [
					{ name: 'วัดชลอ', postcode: '11130' },
					{ name: 'บางกรวย', postcode: '11130' },
					{ name: 'บางสีทอง', postcode: '11130' },
					{ name: 'บางขนุน', postcode: '11130' },
					{ name: 'บางขุนกอง', postcode: '11130' },
					{ name: 'บางคูเวียง', postcode: '11130' },
					{ name: 'มหาสวัสดิ์', postcode: '11130' },
					{ name: 'ปลายบาง', postcode: '11130' },
					{ name: 'ศาลากลาง', postcode: '11130' },
				],
			},
			{
				name: 'บางใหญ่',
				subDistricts: [
					{ name: 'บางใหญ่', postcode: '11140' },
					{ name: 'บางแม่นาง', postcode: '11140' },
					{ name: 'เสาธงหิน', postcode: '11140' },
					{ name: 'บ้านใหม่', postcode: '11140' },
					{ name: 'บางม่วง', postcode: '11140' },
					{ name: 'บางเลน', postcode: '11140' },
				],
			},
			{
				name: 'บางบัวทอง',
				subDistricts: [
					{ name: 'โสนลอย', postcode: '11110' },
					{ name: 'บางบัวทอง', postcode: '11110' },
					{ name: 'บางรักใหญ่', postcode: '11110' },
					{ name: 'บางคูรัด', postcode: '11110' },
					{ name: 'ละหาร', postcode: '11110' },
					{ name: 'ลำโพ', postcode: '11110' },
					{ name: 'พิมลราช', postcode: '11110' },
					{ name: 'บางรักพัฒนา', postcode: '11110' },
				],
			},
			{
				name: 'ปากเกร็ด',
				subDistricts: [
					{ name: 'ปากเกร็ด', postcode: '11120' },
					{ name: 'บางตลาด', postcode: '11120' },
					{ name: 'บ้านใหม่', postcode: '11120' },
					{ name: 'บางพูด', postcode: '11120' },
					{ name: 'บางตะไนย์', postcode: '11120' },
					{ name: 'คลองเกลือ', postcode: '11120' },
					{ name: 'ท่าอิฐ', postcode: '11120' },
					{ name: 'เกาะเกร็ด', postcode: '11120' },
					{ name: 'อ้อมเกร็ด', postcode: '11120' },
					{ name: 'คลองข่อย', postcode: '11120' },
					{ name: 'บางพลับ', postcode: '11120' },
					{ name: 'คลองพระอุดม', postcode: '11120' },
				],
			},
			{
				name: 'ไทรน้อย',
				subDistricts: [
					{ name: 'ไทรน้อย', postcode: '11150' },
					{ name: 'ราษฎร์นิยม', postcode: '11150' },
					{ name: 'หนองเพรางาย', postcode: '11150' },
					{ name: 'ไทรใหญ่', postcode: '11150' },
					{ name: 'ขุนศรี', postcode: '11150' },
					{ name: 'คลองขวาง', postcode: '11150' },
					{ name: 'ทวีวัฒนา', postcode: '11150' },
				],
			},
		],
	},
	{
		name: 'ปทุมธานี',
		districts: [
			{
				name: 'เมืองปทุมธานี',
				subDistricts: [
					{ name: 'บางปรอก', postcode: '12000' },
					{ name: 'บ้านใหม่', postcode: '12000' },
					{ name: 'บ้านกลาง', postcode: '12000' },
					{ name: 'บ้านฉาง', postcode: '12000' },
					{ name: 'บ้านกระแชง', postcode: '12000' },
					{ name: 'บางขะแยง', postcode: '12000' },
					{ name: 'บางคูวัด', postcode: '12000' },
					{ name: 'บางหลวง', postcode: '12000' },
					{ name: 'บางเดื่อ', postcode: '12000' },
					{ name: 'บางพูน', postcode: '12000' },
					{ name: 'บางพูด', postcode: '12000' },
					{ name: 'บางกะดี', postcode: '12000' },
					{ name: 'สวนพริกไทย', postcode: '12000' },
					{ name: 'หลักหก', postcode: '12000' },
				],
			},
			{
				name: 'คลองหลวง',
				subDistricts: [
					{ name: 'คลองหนึ่ง', postcode: '12120' },
					{ name: 'คลองสอง', postcode: '12120' },
					{ name: 'คลองสาม', postcode: '12120' },
					{ name: 'คลองสี่', postcode: '12120' },
					{ name: 'คลองห้า', postcode: '12120' },
					{ name: 'คลองหก', postcode: '12120' },
					{ name: 'คลองเจ็ด', postcode: '12120' },
				],
			},
			{
				name: 'ธัญบุรี',
				subDistricts: [
					{ name: 'ประชาธิปัตย์', postcode: '12130' },
					{ name: 'บึงยี่โถ', postcode: '12130' },
					{ name: 'รังสิต', postcode: '12110' },
					{ name: 'ลำผักกูด', postcode: '12110' },
					{ name: 'บึงสนั่น', postcode: '12110' },
					{ name: 'บึงน้ำรักษ์', postcode: '12110' },
				],
			},
			{
				name: 'ลำลูกกา',
				subDistricts: [
					{ name: 'ลำลูกกา', postcode: '12150' },
					{ name: 'บึงคอไห', postcode: '12150' },
					{ name: 'ลำไทร', postcode: '12150' },
					{ name: 'บึงทองหลาง', postcode: '12150' },
					{ name: 'ลำสวรรค์', postcode: '12150' },
					{ name: 'พืชอุดม', postcode: '12150' },
					{ name: 'บึงคำพร้อย', postcode: '12150' },
					{ name: 'หนองรี', postcode: '12150' },
				],
			},
			{
				name: 'สามโคก',
				subDistricts: [
					{ name: 'สามโคก', postcode: '12160' },
					{ name: 'กระแชง', postcode: '12160' },
					{ name: 'บางโพธิ์เหนือ', postcode: '12160' },
					{ name: 'เชียงรากน้อย', postcode: '12160' },
					{ name: 'บ้านงิ้ว', postcode: '12160' },
					{ name: 'เชียงรากใหญ่', postcode: '12160' },
					{ name: 'บ้านปทุม', postcode: '12160' },
					{ name: 'บางกระบือ', postcode: '12160' },
					{ name: 'ท้ายเกาะ', postcode: '12160' },
					{ name: 'คลองควาย', postcode: '12160' },
					{ name: 'บางเตย', postcode: '12160' },
				],
			},
			{
				name: 'หนองเสือ',
				subDistricts: [
					{ name: 'บึงบา', postcode: '12170' },
					{ name: 'บึงบอน', postcode: '12170' },
					{ name: 'ศาลาครุ', postcode: '12170' },
					{ name: 'หนองสามวัง', postcode: '12170' },
					{ name: 'ศาลาพัน', postcode: '12170' },
					{ name: 'บึงกาสาม', postcode: '12170' },
					{ name: 'หนองเสือ', postcode: '12170' },
				],
			},
			{
				name: 'ลาดหลุมแก้ว',
				subDistricts: [
					{ name: 'ระแหง', postcode: '12140' },
					{ name: 'ลาดหลุมแก้ว', postcode: '12140' },
					{ name: 'คูบางหลวง', postcode: '12140' },
					{ name: 'คูขวาง', postcode: '12140' },
					{ name: 'คลองพระอุดม', postcode: '12140' },
					{ name: 'บ่อเงิน', postcode: '12140' },
					{ name: 'หน้าไม้', postcode: '12140' },
				],
			},
		],
	},
	{
		name: 'สมุทรปราการ',
		districts: [
			{
				name: 'เมืองสมุทรปราการ',
				subDistricts: [
					{ name: 'ปากน้ำ', postcode: '10270' },
					{ name: 'สำโรงเหนือ', postcode: '10270' },
					{ name: 'บางเมือง', postcode: '10270' },
					{ name: 'ท้ายบ้าน', postcode: '10280' },
					{ name: 'บางปูใหม่', postcode: '10280' },
					{ name: 'แพรกษา', postcode: '10280' },
					{ name: 'บางโปรง', postcode: '10270' },
					{ name: 'บางปู', postcode: '10280' },
					{ name: 'บางด้วน', postcode: '10270' },
					{ name: 'บางเมืองใหม่', postcode: '10270' },
					{ name: 'เทพารักษ์', postcode: '10270' },
					{ name: 'ท้ายบ้านใหม่', postcode: '10280' },
					{ name: 'แพรกษาใหม่', postcode: '10280' },
				],
			},
			{
				name: 'บางบ่อ',
				subDistricts: [
					{ name: 'บางบ่อ', postcode: '10560' },
					{ name: 'บ้านระกาศ', postcode: '10560' },
					{ name: 'บางพลีน้อย', postcode: '10560' },
					{ name: 'บางเพรียง', postcode: '10560' },
					{ name: 'คลองด่าน', postcode: '10550' },
					{ name: 'คลองสวน', postcode: '10560' },
					{ name: 'เปร็ง', postcode: '10560' },
					{ name: 'คลองนิยมยาตรา', postcode: '10560' },
				],
			},
			{
				name: 'บางพลี',
				subDistricts: [
					{ name: 'บางพลีใหญ่', postcode: '10540' },
					{ name: 'บางแก้ว', postcode: '10540' },
					{ name: 'บางปลา', postcode: '10540' },
					{ name: 'บางโฉลง', postcode: '10540' },
					{ name: 'ราชาเทวะ', postcode: '10540' },
					{ name: 'หนองปรือ', postcode: '10540' },
				],
			},
			{
				name: 'พระประแดง',
				subDistricts: [
					{ name: 'ตลาด', postcode: '10130' },
					{ name: 'บางพึ่ง', postcode: '10130' },
					{ name: 'บางจาก', postcode: '10130' },
					{ name: 'บางครุ', postcode: '10130' },
					{ name: 'บางหญ้าแพรก', postcode: '10130' },
					{ name: 'บางหัวเสือ', postcode: '10130' },
					{ name: 'สำโรงใต้', postcode: '10130' },
					{ name: 'สำโรง', postcode: '10130' },
					{ name: 'สำโรงกลาง', postcode: '10130' },
					{ name: 'บางยอ', postcode: '10130' },
					{ name: 'บางกะเจ้า', postcode: '10130' },
					{ name: 'บางน้ำผึ้ง', postcode: '10130' },
					{ name: 'บางกระสอบ', postcode: '10130' },
					{ name: 'บางกอบัว', postcode: '10130' },
					{ name: 'ทรงคนอง', postcode: '10130' },
				],
			},
			{
				name: 'พระสมุทรเจดีย์',
				subDistricts: [
					{ name: 'นาเกลือ', postcode: '10290' },
					{ name: 'บ้านคลองสวน', postcode: '10290' },
					{ name: 'แหลมฟ้าผ่า', postcode: '10290' },
					{ name: 'ปากคลองบางปลากด', postcode: '10290' },
					{ name: 'ในคลองบางปลากด', postcode: '10290' },
				],
			},
			{
				name: 'บางเสาธง',
				subDistricts: [
					{ name: 'บางเสาธง', postcode: '10570' },
					{ name: 'ศีรษะจรเข้น้อย', postcode: '10570' },
					{ name: 'ศีรษะจรเข้ใหญ่', postcode: '10570' },
				],
			},
		],
	},
	{
		name: 'เชียงใหม่',
		districts: [
			{
				name: 'เมืองเชียงใหม่',
				subDistricts: [
					{ name: 'ศรีภูมิ', postcode: '50200' },
					{ name: 'พระสิงห์', postcode: '50200' },
					{ name: 'หายยา', postcode: '50100' },
					{ name: 'ช้างม่อย', postcode: '50300' },
					{ name: 'ช้างคลาน', postcode: '50100' },
					{ name: 'วัดเกต', postcode: '50000' },
					{ name: 'ช้างเผือก', postcode: '50300' },
					{ name: 'สุเทพ', postcode: '50200' },
					{ name: 'แม่เหียะ', postcode: '50100' },
					{ name: 'ป่าแดด', postcode: '50100' },
					{ name: 'หนองหอย', postcode: '50000' },
					{ name: 'ท่าศาลา', postcode: '50000' },
					{ name: 'หนองป่าครั่ง', postcode: '50000' },
					{ name: 'ฟ้าฮ่าม', postcode: '50000' },
					{ name: 'ป่าตัน', postcode: '50300' },
					{ name: 'สันผีเสื้อ', postcode: '50300' },
				],
			},
			{
				name: 'หางดง',
				subDistricts: [
					{ name: 'หางดง', postcode: '50230' },
					{ name: 'หนองแก๋ว', postcode: '50230' },
					{ name: 'หารแก้ว', postcode: '50230' },
					{ name: 'หนองตอง', postcode: '50340' },
					{ name: 'ขุนคง', postcode: '50230' },
					{ name: 'สบแม่ข่า', postcode: '50230' },
					{ name: 'บ้านแหวน', postcode: '50230' },
					{ name: 'สันผักหวาน', postcode: '50230' },
					{ name: 'หนองควาย', postcode: '50230' },
					{ name: 'บ้านปง', postcode: '50230' },
					{ name: 'น้ำแพร่', postcode: '50230' },
				],
			},
			{
				name: 'สันทราย',
				subDistricts: [
					{ name: 'สันทรายหลวง', postcode: '50210' },
					{ name: 'สันทรายน้อย', postcode: '50210' },
					{ name: 'สันพระเนตร', postcode: '50210' },
					{ name: 'สันนาเม็ง', postcode: '50210' },
					{ name: 'สันป่าเปา', postcode: '50210' },
					{ name: 'หนองแหย่ง', postcode: '50210' },
					{ name: 'หนองจ๊อม', postcode: '50210' },
					{ name: 'หนองหาร', postcode: '50290' },
					{ name: 'แม่แฝก', postcode: '50290' },
					{ name: 'แม่แฝกใหม่', postcode: '50290' },
					{ name: 'เมืองเล็น', postcode: '50210' },
					{ name: 'ป่าไผ่', postcode: '50210' },
				],
			},
			{
				name: 'สันกำแพง',
				subDistricts: [
					{ name: 'สันกำแพง', postcode: '50130' },
					{ name: 'ทรายมูล', postcode: '50130' },
					{ name: 'ร้องวัวแดง', postcode: '50130' },
					{ name: 'บวกค้าง', postcode: '50130' },
					{ name: 'แช่ช้าง', postcode: '50130' },
					{ name: 'ออนใต้', postcode: '50130' },
					{ name: 'แม่ปูคา', postcode: '50130' },
					{ name: 'ห้วยทราย', postcode: '50130' },
					{ name: 'ต้นเปา', postcode: '50130' },
					{ name: 'สันกลาง', postcode: '50130' },
				],
			},
			{
				name: 'แม่ริม',
				subDistricts: [
					{ name: 'ริมใต้', postcode: '50180' },
					{ name: 'ริมเหนือ', postcode: '50180' },
					{ name: 'สันโป่ง', postcode: '50180' },
					{ name: 'ขี้เหล็ก', postcode: '50180' },
					{ name: 'สะลวง', postcode: '50330' },
					{ name: 'ห้วยทราย', postcode: '50180' },
					{ name: 'แม่แรม', postcode: '50180' },
					{ name: 'โป่งแยง', postcode: '50180' },
					{ name: 'แม่สา', postcode: '50180' },
					{ name: 'ดอนแก้ว', postcode: '50180' },
					{ name: 'เหมืองแก้ว', postcode: '50180' },
				],
			},
		],
	},
	{
		name: 'ชลบุรี',
		districts: [
			{
				name: 'เมืองชลบุรี',
				subDistricts: [
					{ name: 'บางปลาสร้อย', postcode: '20000' },
					{ name: 'มะขามหย่ง', postcode: '20000' },
					{ name: 'บ้านโขด', postcode: '20000' },
					{ name: 'แสนสุข', postcode: '20130' },
					{ name: 'บ้านสวน', postcode: '20000' },
					{ name: 'หนองรี', postcode: '20000' },
					{ name: 'นาป่า', postcode: '20000' },
					{ name: 'หนองข้างคอก', postcode: '20000' },
					{ name: 'บางทราย', postcode: '20000' },
					{ name: 'คลองตำหรุ', postcode: '20000' },
					{ name: 'เหมือง', postcode: '20130' },
					{ name: 'บ้านปึก', postcode: '20130' },
					{ name: 'ห้วยกะปิ', postcode: '20000' },
					{ name: 'เสม็ด', postcode: '20000' },
					{ name: 'อ่างศิลา', postcode: '20000' },
					{ name: 'สำนักบก', postcode: '20000' },
					{ name: 'หนองไม้แดง', postcode: '20000' },
					{ name: 'ดอนหัวฬ่อ', postcode: '20000' },
				],
			},
			{
				name: 'บางละมุง',
				subDistricts: [
					{ name: 'บางละมุง', postcode: '20150' },
					{ name: 'หนองปรือ', postcode: '20150' },
					{ name: 'หนองปลาไหล', postcode: '20150' },
					{ name: 'โป่ง', postcode: '20150' },
					{ name: 'เขาไม้แก้ว', postcode: '20150' },
					{ name: 'ห้วยใหญ่', postcode: '20150' },
					{ name: 'ตะเคียนเตี้ย', postcode: '20150' },
					{ name: 'นาเกลือ', postcode: '20150' },
				],
			},
			{
				name: 'ศรีราชา',
				subDistricts: [
					{ name: 'ศรีราชา', postcode: '20110' },
					{ name: 'สุรศักดิ์', postcode: '20110' },
					{ name: 'ทุ่งสุขลา', postcode: '20230' },
					{ name: 'บึง', postcode: '20230' },
					{ name: 'หนองขาม', postcode: '20110' },
					{ name: 'เขาคันทรง', postcode: '20110' },
					{ name: 'บางพระ', postcode: '20110' },
					{ name: 'บ่อวิน', postcode: '20230' },
				],
			},
			{
				name: 'พัทยา',
				subDistricts: [
					{ name: 'นาเกลือ', postcode: '20150' },
					{ name: 'หนองปรือ', postcode: '20150' },
					{ name: 'หนองปลาไหล', postcode: '20150' },
					{ name: 'ห้วยใหญ่', postcode: '20150' },
				],
			},
		],
	},
	{
		name: 'ขอนแก่น',
		districts: [
			{
				name: 'เมืองขอนแก่น',
				subDistricts: [
					{ name: 'ในเมือง', postcode: '40000' },
					{ name: 'สำราญ', postcode: '40000' },
					{ name: 'โคกสี', postcode: '40000' },
					{ name: 'ท่าพระ', postcode: '40260' },
					{ name: 'บ้านทุ่ม', postcode: '40000' },
					{ name: 'เมืองเก่า', postcode: '40000' },
					{ name: 'พระลับ', postcode: '40000' },
					{ name: 'สาวะถี', postcode: '40000' },
					{ name: 'บ้านหว้า', postcode: '40000' },
					{ name: 'บึงเนียม', postcode: '40000' },
					{ name: 'โนนท่อน', postcode: '40000' },
					{ name: 'ศิลา', postcode: '40000' },
					{ name: 'บ้านค้อ', postcode: '40000' },
					{ name: 'แดงใหญ่', postcode: '40000' },
					{ name: 'ดอนช้าง', postcode: '40000' },
					{ name: 'ดอนหัน', postcode: '40260' },
					{ name: 'ทุ่มใหญ่', postcode: '40000' },
					{ name: 'หนองตูม', postcode: '40000' },
				],
			},
		],
	},
	{
		name: 'ภูเก็ต',
		districts: [
			{
				name: 'เมืองภูเก็ต',
				subDistricts: [
					{ name: 'ตลาดใหญ่', postcode: '83000' },
					{ name: 'ตลาดเหนือ', postcode: '83000' },
					{ name: 'เกาะแก้ว', postcode: '83000' },
					{ name: 'รัษฎา', postcode: '83000' },
					{ name: 'วิชิต', postcode: '83000' },
					{ name: 'ฉลอง', postcode: '83130' },
					{ name: 'ราไวย์', postcode: '83130' },
					{ name: 'กะรน', postcode: '83100' },
				],
			},
			{
				name: 'กะทู้',
				subDistricts: [
					{ name: 'กะทู้', postcode: '83120' },
					{ name: 'ป่าตอง', postcode: '83150' },
					{ name: 'กมลา', postcode: '83150' },
				],
			},
			{
				name: 'ถลาง',
				subDistricts: [
					{ name: 'เทพกระษัตรี', postcode: '83110' },
					{ name: 'ศรีสุนทร', postcode: '83110' },
					{ name: 'เชิงทะเล', postcode: '83110' },
					{ name: 'ป่าคลอก', postcode: '83110' },
					{ name: 'ไม้ขาว', postcode: '83110' },
					{ name: 'สาคู', postcode: '83110' },
				],
			},
		],
	},
	{
		name: 'นครราชสีมา',
		districts: [
			{
				name: 'เมืองนครราชสีมา',
				subDistricts: [
					{ name: 'ในเมือง', postcode: '30000' },
					{ name: 'โพธิ์กลาง', postcode: '30000' },
					{ name: 'หนองจะบก', postcode: '30000' },
					{ name: 'โคกสูง', postcode: '30310' },
					{ name: 'มะเริง', postcode: '30000' },
					{ name: 'หนองระเวียง', postcode: '30000' },
					{ name: 'ปรุใหญ่', postcode: '30000' },
					{ name: 'หมื่นไวย', postcode: '30000' },
					{ name: 'พลกรัง', postcode: '30000' },
					{ name: 'หนองไผ่ล้อม', postcode: '30000' },
					{ name: 'บ้านเกาะ', postcode: '30000' },
					{ name: 'จอหอ', postcode: '30310' },
					{ name: 'บ้านใหม่', postcode: '30000' },
					{ name: 'พุดซา', postcode: '30000' },
					{ name: 'บ้านโพธิ์', postcode: '30310' },
					{ name: 'สุรนารี', postcode: '30000' },
					{ name: 'สีมุม', postcode: '30000' },
					{ name: 'ตลาด', postcode: '30310' },
					{ name: 'หนองบัวศาลา', postcode: '30000' },
					{ name: 'หัวทะเล', postcode: '30000' },
					{ name: 'บ้านค้อ', postcode: '30000' },
					{ name: 'หนองกระทุ่ม', postcode: '30000' },
					{ name: 'ไชยมงคล', postcode: '30000' },
					{ name: 'หนองไข่น้ำ', postcode: '30310' },
					{ name: 'โคกกรวด', postcode: '30280' },
				],
			},
		],
	},
	{
		name: 'เชียงราย',
		districts: [
			{
				name: 'เมืองเชียงราย',
				subDistricts: [
					{ name: 'เวียง', postcode: '57000' },
					{ name: 'รอบเวียง', postcode: '57000' },
					{ name: 'บ้านดู่', postcode: '57100' },
					{ name: 'นางแล', postcode: '57100' },
					{ name: 'แม่ข้าวต้ม', postcode: '57100' },
					{ name: 'แม่ยาว', postcode: '57100' },
					{ name: 'สันทราย', postcode: '57000' },
					{ name: 'แม่กรณ์', postcode: '57000' },
					{ name: 'ห้วยชมภู', postcode: '57000' },
					{ name: 'ห้วยสัก', postcode: '57000' },
					{ name: 'ริมกก', postcode: '57100' },
					{ name: 'ดอยลาน', postcode: '57000' },
					{ name: 'ป่าอ้อดอนชัย', postcode: '57000' },
					{ name: 'ท่าสาย', postcode: '57000' },
					{ name: 'ดอยฮาง', postcode: '57000' },
					{ name: 'ท่าสุด', postcode: '57100' },
				],
			},
		],
	},
	{
		name: 'สงขลา',
		districts: [
			{
				name: 'หาดใหญ่',
				subDistricts: [
					{ name: 'หาดใหญ่', postcode: '90110' },
					{ name: 'ควนลัง', postcode: '90110' },
					{ name: 'คูเต่า', postcode: '90110' },
					{ name: 'คอหงส์', postcode: '90110' },
					{ name: 'คลองแห', postcode: '90110' },
					{ name: 'คลองอู่ตะเภา', postcode: '90110' },
					{ name: 'ฉลุง', postcode: '90110' },
					{ name: 'ทุ่งใหญ่', postcode: '90110' },
					{ name: 'ทุ่งตำเสา', postcode: '90110' },
					{ name: 'ท่าข้าม', postcode: '90110' },
					{ name: 'น้ำน้อย', postcode: '90110' },
					{ name: 'บ้านพรุ', postcode: '90250' },
					{ name: 'พะตง', postcode: '90230' },
				],
			},
			{
				name: 'เมืองสงขลา',
				subDistricts: [
					{ name: 'บ่อยาง', postcode: '90000' },
					{ name: 'เขารูปช้าง', postcode: '90000' },
					{ name: 'เกาะแต้ว', postcode: '90000' },
					{ name: 'พะวง', postcode: '90100' },
					{ name: 'ทุ่งหวัง', postcode: '90000' },
					{ name: 'เกาะยอ', postcode: '90100' },
				],
			},
		],
	},
	{
		name: 'นครปฐม',
		districts: [
			{
				name: 'เมืองนครปฐม',
				subDistricts: [
					{ name: 'พระปฐมเจดีย์', postcode: '73000' },
					{ name: 'บางแขม', postcode: '73000' },
					{ name: 'พระประโทน', postcode: '73000' },
					{ name: 'ธรรมศาลา', postcode: '73000' },
					{ name: 'ตาก้อง', postcode: '73000' },
					{ name: 'มาบแค', postcode: '73000' },
					{ name: 'สนามจันทร์', postcode: '73000' },
					{ name: 'ดอนยายหอม', postcode: '73000' },
					{ name: 'ถนนขาด', postcode: '73000' },
					{ name: 'บ่อพลับ', postcode: '73000' },
					{ name: 'นครปฐม', postcode: '73000' },
					{ name: 'วังตะกู', postcode: '73000' },
					{ name: 'หนองปากโลง', postcode: '73000' },
					{ name: 'สามควายเผือก', postcode: '73000' },
					{ name: 'ทุ่งน้อย', postcode: '73000' },
					{ name: 'หนองดินแดง', postcode: '73000' },
					{ name: 'วังเย็น', postcode: '73000' },
					{ name: 'โพรงมะเดื่อ', postcode: '73000' },
					{ name: 'ลำพยา', postcode: '73000' },
					{ name: 'สระกะเทียม', postcode: '73000' },
					{ name: 'ทัพหลวง', postcode: '73000' },
					{ name: 'หนองงูเหลือม', postcode: '73000' },
					{ name: 'บ้านยาง', postcode: '73000' },
					{ name: 'พะเนียด', postcode: '73000' },
				],
			},
			{
				name: 'พุทธมณฑล',
				subDistricts: [
					{ name: 'ศาลายา', postcode: '73170' },
					{ name: 'คลองโยง', postcode: '73170' },
					{ name: 'มหาสวัสดิ์', postcode: '73170' },
				],
			},
			{
				name: 'สามพราน',
				subDistricts: [
					{ name: 'ท่าข้าม', postcode: '73110' },
					{ name: 'ทรงคนอง', postcode: '73210' },
					{ name: 'หอมเกร็ด', postcode: '73110' },
					{ name: 'บางกระทึก', postcode: '73210' },
					{ name: 'บางเตย', postcode: '73210' },
					{ name: 'สามพราน', postcode: '73110' },
					{ name: 'บางช้าง', postcode: '73110' },
					{ name: 'ไร่ขิง', postcode: '73210' },
					{ name: 'ท่าตลาด', postcode: '73110' },
					{ name: 'กระทุ่มล้ม', postcode: '73220' },
					{ name: 'คลองใหม่', postcode: '73110' },
					{ name: 'ตลาดจินดา', postcode: '73110' },
					{ name: 'คลองจินดา', postcode: '73110' },
					{ name: 'ยายชา', postcode: '73110' },
					{ name: 'บ้านใหม่', postcode: '73110' },
					{ name: 'อ้อมใหญ่', postcode: '73160' },
				],
			},
		],
	},
	{
		name: 'สมุทรสาคร',
		districts: [
			{
				name: 'เมืองสมุทรสาคร',
				subDistricts: [
					{ name: 'มหาชัย', postcode: '74000' },
					{ name: 'ท่าฉลอม', postcode: '74000' },
					{ name: 'โกรกกราก', postcode: '74000' },
					{ name: 'บ้านบ่อ', postcode: '74000' },
					{ name: 'บางโทรัด', postcode: '74000' },
					{ name: 'กาหลง', postcode: '74000' },
					{ name: 'นาดี', postcode: '74000' },
					{ name: 'ท่าจีน', postcode: '74000' },
					{ name: 'นาโคก', postcode: '74000' },
					{ name: 'โคกขาม', postcode: '74000' },
					{ name: 'บ้านเกาะ', postcode: '74000' },
					{ name: 'บางหญ้าแพรก', postcode: '74000' },
					{ name: 'บางกระเจ้า', postcode: '74000' },
					{ name: 'พันท้ายนรสิงห์', postcode: '74000' },
					{ name: 'ท่าทราย', postcode: '74000' },
					{ name: 'คอกกระบือ', postcode: '74000' },
					{ name: 'บางน้ำจืด', postcode: '74000' },
					{ name: 'ชัยมงคล', postcode: '74000' },
				],
			},
		],
	},
];

// ── Helper functions ──

/** Get list of all province names */
export function getProvinces(): string[] {
	return THAI_ADDRESS_DATA.map((p) => p.name);
}

/** Get list of district names for a province */
export function getDistricts(provinceName: string): string[] {
	const province = THAI_ADDRESS_DATA.find((p) => p.name === provinceName);
	return province ? province.districts.map((d) => d.name) : [];
}

/** Get list of sub-district names for a district within a province */
export function getSubDistricts(provinceName: string, districtName: string): string[] {
	const province = THAI_ADDRESS_DATA.find((p) => p.name === provinceName);
	if (!province) return [];
	const district = province.districts.find((d) => d.name === districtName);
	return district ? district.subDistricts.map((sd) => sd.name) : [];
}

/** Get postcode for a sub-district within a district within a province */
export function getPostcode(
	provinceName: string,
	districtName: string,
	subDistrictName: string,
): string {
	const province = THAI_ADDRESS_DATA.find((p) => p.name === provinceName);
	if (!province) return '';
	const district = province.districts.find((d) => d.name === districtName);
	if (!district) return '';
	const subDistrict = district.subDistricts.find((sd) => sd.name === subDistrictName);
	return subDistrict?.postcode ?? '';
}