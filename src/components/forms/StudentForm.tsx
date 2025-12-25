import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { User, GraduationCap, Users, MapPin, Settings } from 'lucide-react';

// Constants for Bangladeshi schools
const CLASSES = ['প্লে', 'নার্সারী', 'কেজি', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম', 'একাদশ', 'দ্বাদশ'];
const SECTIONS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELIGIONS = ['ইসলাম', 'হিন্দু', 'বৌদ্ধ', 'খ্রিষ্টান', 'অন্যান্য'];
const GENDERS = [
  { value: 'male', label: 'ছেলে' },
  { value: 'female', label: 'মেয়ে' },
  { value: 'other', label: 'অন্যান্য' },
];
const GROUPS = ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা'];
const SHIFTS = ['প্রভাতী', 'দিবা', 'বিকাল'];
const VERSIONS = ['বাংলা', 'ইংরেজি'];
const GUARDIAN_RELATIONS = ['পিতা', 'মাতা', 'দাদা', 'দাদী', 'নানা', 'নানী', 'চাচা', 'মামা', 'অন্যান্য'];

const DISTRICTS = [
  'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ',
  'গাজীপুর', 'নারায়ণগঞ্জ', 'কুমিল্লা', 'ফেনী', 'নোয়াখালী', 'ব্রাহ্মণবাড়িয়া', 'কক্সবাজার',
  'চাঁদপুর', 'লক্ষ্মীপুর', 'জামালপুর', 'শেরপুর', 'নেত্রকোনা', 'কিশোরগঞ্জ', 'মানিকগঞ্জ',
  'মুন্সিগঞ্জ', 'নরসিংদী', 'ফরিদপুর', 'গোপালগঞ্জ', 'মাদারীপুর', 'রাজবাড়ী', 'শরীয়তপুর',
  'টাঙ্গাইল', 'বগুড়া', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট', 'নওগাঁ', 'নাটোর', 'নবাবগঞ্জ',
  'পাবনা', 'সিরাজগঞ্জ', 'বাগেরহাট', 'চুয়াডাঙ্গা', 'যশোর', 'ঝিনাইদহ', 'কুষ্টিয়া',
  'মাগুরা', 'মেহেরপুর', 'নড়াইল', 'সাতক্ষীরা', 'বরগুনা', 'ভোলা', 'ঝালকাঠি', 'পটুয়াখালী',
  'পিরোজপুর', 'হবিগঞ্জ', 'মৌলভীবাজার', 'সুনামগঞ্জ', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম',
  'লালমনিরহাট', 'নীলফামারী', 'পঞ্চগড়', 'ঠাকুরগাঁও', 'বান্দরবান', 'খাগড়াছড়ি', 'রাঙ্গামাটি',
];

export interface StudentFormData {
  // Personal Info
  admission_id: string;
  roll_number: string;
  full_name: string;
  full_name_bn: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  religion: string;
  nationality: string;
  birth_certificate_no: string;
  
  // Academic Info
  class: string;
  section: string;
  academic_year: string;
  group_stream: string;
  shift: string;
  version: string;
  previous_school: string;
  
  // Guardian Info
  father_name: string;
  father_name_bn: string;
  mother_name: string;
  mother_name_bn: string;
  guardian_name: string;
  guardian_name_bn: string;
  guardian_relation: string;
  guardian_mobile: string;
  alternative_contact: string;
  guardian_occupation: string;
  
  // Address Info
  present_address: string;
  present_district: string;
  present_upazila: string;
  permanent_address: string;
  permanent_district: string;
  permanent_upazila: string;
  
  // Contact & System
  phone: string;
  email: string;
  create_accounts: boolean;
  parent_email: string;
}

interface StudentFormProps {
  formData: StudentFormData;
  onChange: (data: StudentFormData) => void;
  isEditing: boolean;
}

export const initialStudentFormData: StudentFormData = {
  admission_id: '',
  roll_number: '',
  full_name: '',
  full_name_bn: '',
  date_of_birth: '',
  gender: '',
  blood_group: '',
  religion: '',
  nationality: 'বাংলাদেশী',
  birth_certificate_no: '',
  class: '',
  section: '',
  academic_year: new Date().getFullYear().toString(),
  group_stream: '',
  shift: '',
  version: 'বাংলা',
  previous_school: '',
  father_name: '',
  father_name_bn: '',
  mother_name: '',
  mother_name_bn: '',
  guardian_name: '',
  guardian_name_bn: '',
  guardian_relation: '',
  guardian_mobile: '',
  alternative_contact: '',
  guardian_occupation: '',
  present_address: '',
  present_district: '',
  present_upazila: '',
  permanent_address: '',
  permanent_district: '',
  permanent_upazila: '',
  phone: '',
  email: '',
  create_accounts: true,
  parent_email: '',
};

export default function StudentForm({ formData, onChange, isEditing }: StudentFormProps) {
  const [sameAsPresent, setSameAsPresent] = useState(false);

  const handleChange = (field: keyof StudentFormData, value: string | boolean) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSameAddress = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      onChange({
        ...formData,
        permanent_address: formData.present_address,
        permanent_district: formData.present_district,
        permanent_upazila: formData.present_upazila,
      });
    }
  };

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="personal" className="text-xs sm:text-sm font-bangla">
          <User className="w-4 h-4 mr-1 hidden sm:inline" /> ব্যক্তিগত
        </TabsTrigger>
        <TabsTrigger value="academic" className="text-xs sm:text-sm font-bangla">
          <GraduationCap className="w-4 h-4 mr-1 hidden sm:inline" /> শিক্ষা
        </TabsTrigger>
        <TabsTrigger value="guardian" className="text-xs sm:text-sm font-bangla">
          <Users className="w-4 h-4 mr-1 hidden sm:inline" /> অভিভাবক
        </TabsTrigger>
        <TabsTrigger value="address" className="text-xs sm:text-sm font-bangla">
          <MapPin className="w-4 h-4 mr-1 hidden sm:inline" /> ঠিকানা
        </TabsTrigger>
        <TabsTrigger value="system" className="text-xs sm:text-sm font-bangla">
          <Settings className="w-4 h-4 mr-1 hidden sm:inline" /> সিস্টেম
        </TabsTrigger>
      </TabsList>

      {/* Personal Information Tab */}
      <TabsContent value="personal" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">ভর্তি আইডি</Label>
            <Input
              value={formData.admission_id}
              onChange={(e) => handleChange('admission_id', e.target.value)}
              placeholder="স্বয়ংক্রিয় / ম্যানুয়াল"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">রোল নম্বর *</Label>
            <Input
              value={formData.roll_number}
              onChange={(e) => handleChange('roll_number', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">নাম (ইংরেজি) *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">নাম (বাংলা) *</Label>
            <Input
              value={formData.full_name_bn}
              onChange={(e) => handleChange('full_name_bn', e.target.value)}
              placeholder="জন ডো"
              className="font-bangla"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">জন্ম তারিখ *</Label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">লিঙ্গ *</Label>
            <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger>
                <SelectValue placeholder="নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value} className="font-bangla">
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">রক্তের গ্রুপ</Label>
            <Select value={formData.blood_group} onValueChange={(v) => handleChange('blood_group', v)}>
              <SelectTrigger>
                <SelectValue placeholder="নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">ধর্ম</Label>
            <Select value={formData.religion} onValueChange={(v) => handleChange('religion', v)}>
              <SelectTrigger>
                <SelectValue placeholder="নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {RELIGIONS.map((r) => (
                  <SelectItem key={r} value={r} className="font-bangla">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">জাতীয়তা</Label>
            <Input
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              className="font-bangla"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">জন্ম সনদ নম্বর</Label>
            <Input
              value={formData.birth_certificate_no}
              onChange={(e) => handleChange('birth_certificate_no', e.target.value)}
              placeholder="17 ডিজিট"
            />
          </div>
        </div>
      </TabsContent>

      {/* Academic Information Tab */}
      <TabsContent value="academic" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">শ্রেণী *</Label>
            <Select value={formData.class} onValueChange={(v) => handleChange('class', v)}>
              <SelectTrigger>
                <SelectValue placeholder="শ্রেণী নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c} className="font-bangla">{c} শ্রেণী</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">সেকশন</Label>
            <Select value={formData.section} onValueChange={(v) => handleChange('section', v)}>
              <SelectTrigger>
                <SelectValue placeholder="সেকশন নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="font-bangla">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">শিক্ষাবর্ষ</Label>
            <Input
              value={formData.academic_year}
              onChange={(e) => handleChange('academic_year', e.target.value)}
              placeholder="2024"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">বিভাগ/শাখা</Label>
            <Select value={formData.group_stream} onValueChange={(v) => handleChange('group_stream', v)}>
              <SelectTrigger>
                <SelectValue placeholder="বিভাগ নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map((g) => (
                  <SelectItem key={g} value={g} className="font-bangla">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">শিফট</Label>
            <Select value={formData.shift} onValueChange={(v) => handleChange('shift', v)}>
              <SelectTrigger>
                <SelectValue placeholder="শিফট নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s} value={s} className="font-bangla">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">ভার্সন</Label>
            <Select value={formData.version} onValueChange={(v) => handleChange('version', v)}>
              <SelectTrigger>
                <SelectValue placeholder="ভার্সন নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {VERSIONS.map((v) => (
                  <SelectItem key={v} value={v} className="font-bangla">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="font-bangla">পূর্ববর্তী স্কুল</Label>
            <Input
              value={formData.previous_school}
              onChange={(e) => handleChange('previous_school', e.target.value)}
              placeholder="পূর্বে পড়াশোনা করা স্কুলের নাম"
              className="font-bangla"
            />
          </div>
        </div>
      </TabsContent>

      {/* Guardian Information Tab */}
      <TabsContent value="guardian" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">পিতার নাম (ইংরেজি) *</Label>
            <Input
              value={formData.father_name}
              onChange={(e) => handleChange('father_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">পিতার নাম (বাংলা)</Label>
            <Input
              value={formData.father_name_bn}
              onChange={(e) => handleChange('father_name_bn', e.target.value)}
              className="font-bangla"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">মাতার নাম (ইংরেজি) *</Label>
            <Input
              value={formData.mother_name}
              onChange={(e) => handleChange('mother_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">মাতার নাম (বাংলা)</Label>
            <Input
              value={formData.mother_name_bn}
              onChange={(e) => handleChange('mother_name_bn', e.target.value)}
              className="font-bangla"
            />
          </div>
          
          <div className="col-span-2 border-t pt-4 mt-2">
            <p className="text-sm text-muted-foreground font-bangla mb-4">
              অভিভাবক (যদি পিতা/মাতা ছাড়া অন্য কেউ হন)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="font-bangla">অভিভাবকের নাম (ইংরেজি)</Label>
            <Input
              value={formData.guardian_name}
              onChange={(e) => handleChange('guardian_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">অভিভাবকের নাম (বাংলা)</Label>
            <Input
              value={formData.guardian_name_bn}
              onChange={(e) => handleChange('guardian_name_bn', e.target.value)}
              className="font-bangla"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">সম্পর্ক</Label>
            <Select value={formData.guardian_relation} onValueChange={(v) => handleChange('guardian_relation', v)}>
              <SelectTrigger>
                <SelectValue placeholder="সম্পর্ক নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {GUARDIAN_RELATIONS.map((r) => (
                  <SelectItem key={r} value={r} className="font-bangla">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">পেশা</Label>
            <Input
              value={formData.guardian_occupation}
              onChange={(e) => handleChange('guardian_occupation', e.target.value)}
              placeholder="যেমন: ব্যবসায়ী, চাকরিজীবী"
              className="font-bangla"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">মোবাইল নম্বর *</Label>
            <Input
              value={formData.guardian_mobile}
              onChange={(e) => handleChange('guardian_mobile', e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">বিকল্প নম্বর</Label>
            <Input
              value={formData.alternative_contact}
              onChange={(e) => handleChange('alternative_contact', e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
        </div>
      </TabsContent>

      {/* Address Information Tab */}
      <TabsContent value="address" className="space-y-4">
        <div className="space-y-4">
          <h4 className="font-semibold font-bangla border-b pb-2">বর্তমান ঠিকানা</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bangla">জেলা</Label>
              <Select value={formData.present_district} onValueChange={(v) => handleChange('present_district', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="জেলা নির্বাচন" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d} className="font-bangla">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bangla">উপজেলা/থানা</Label>
              <Input
                value={formData.present_upazila}
                onChange={(e) => handleChange('present_upazila', e.target.value)}
                placeholder="উপজেলা/থানা"
                className="font-bangla"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="font-bangla">বিস্তারিত ঠিকানা</Label>
              <Textarea
                value={formData.present_address}
                onChange={(e) => handleChange('present_address', e.target.value)}
                placeholder="গ্রাম/মহল্লা, ডাকঘর, পোস্ট কোড"
                className="font-bangla"
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="same_address"
              checked={sameAsPresent}
              onCheckedChange={handleSameAddress}
            />
            <label htmlFor="same_address" className="text-sm font-bangla cursor-pointer">
              স্থায়ী ঠিকানা বর্তমান ঠিকানার সাথে একই
            </label>
          </div>

          <h4 className="font-semibold font-bangla border-b pb-2 pt-4">স্থায়ী ঠিকানা</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bangla">জেলা</Label>
              <Select 
                value={formData.permanent_district} 
                onValueChange={(v) => handleChange('permanent_district', v)}
                disabled={sameAsPresent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="জেলা নির্বাচন" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d} className="font-bangla">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bangla">উপজেলা/থানা</Label>
              <Input
                value={formData.permanent_upazila}
                onChange={(e) => handleChange('permanent_upazila', e.target.value)}
                placeholder="উপজেলা/থানা"
                className="font-bangla"
                disabled={sameAsPresent}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="font-bangla">বিস্তারিত ঠিকানা</Label>
              <Textarea
                value={formData.permanent_address}
                onChange={(e) => handleChange('permanent_address', e.target.value)}
                placeholder="গ্রাম/মহল্লা, ডাকঘর, পোস্ট কোড"
                className="font-bangla"
                rows={2}
                disabled={sameAsPresent}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* System & Account Tab */}
      <TabsContent value="system" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">শিক্ষার্থীর ফোন</Label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">শিক্ষার্থীর ইমেইল</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="student@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">অভিভাবকের ইমেইল (অ্যাকাউন্টের জন্য)</Label>
            <Input
              type="email"
              value={formData.parent_email}
              onChange={(e) => handleChange('parent_email', e.target.value)}
              placeholder="parent@example.com"
            />
          </div>
        </div>

        {!isEditing && (formData.email || formData.parent_email) && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mt-4">
            <Checkbox
              id="create_accounts"
              checked={formData.create_accounts}
              onCheckedChange={(checked) => handleChange('create_accounts', !!checked)}
            />
            <label htmlFor="create_accounts" className="text-sm font-bangla cursor-pointer">
              স্বয়ংক্রিয়ভাবে লগইন অ্যাকাউন্ট তৈরি করুন (শিক্ষার্থী ও অভিভাবক উভয়ের জন্য)
            </label>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-bangla">
            <strong>দ্রষ্টব্য:</strong> অ্যাকাউন্ট তৈরি করলে শিক্ষার্থী এবং অভিভাবক উভয়ই সিস্টেমে লগইন করতে পারবেন। 
            শিক্ষার্থী তাদের ফলাফল, উপস্থিতি ও নোটিশ দেখতে পারবেন। অভিভাবক সন্তানের সকল তথ্য ও ফি পরিশোধ করতে পারবেন।
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
