import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, GraduationCap, Phone, Settings, X, Plus } from 'lucide-react';

// Constants
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELIGIONS = ['ইসলাম', 'হিন্দু', 'বৌদ্ধ', 'খ্রিষ্টান', 'অন্যান্য'];
const GENDERS = [
  { value: 'male', label: 'পুরুষ' },
  { value: 'female', label: 'মহিলা' },
  { value: 'other', label: 'অন্যান্য' },
];
const DESIGNATIONS = [
  'প্রধান শিক্ষক',
  'সহকারী প্রধান শিক্ষক',
  'সিনিয়র শিক্ষক',
  'সহকারী শিক্ষক',
  'জুনিয়র শিক্ষক',
  'খণ্ডকালীন শিক্ষক',
  'অফিস সহকারী',
  'লাইব্রেরিয়ান',
];
const DEPARTMENTS = [
  'বাংলা',
  'ইংরেজি',
  'গণিত',
  'বিজ্ঞান',
  'সমাজ বিজ্ঞান',
  'ধর্ম ও নৈতিক শিক্ষা',
  'শারীরিক শিক্ষা',
  'তথ্য ও যোগাযোগ প্রযুক্তি',
  'চারু ও কারুকলা',
  'সংগীত',
  'কৃষি শিক্ষা',
  'গার্হস্থ্য বিজ্ঞান',
];
const SUBJECTS = [
  'বাংলা',
  'ইংরেজি',
  'গণিত',
  'সাধারণ বিজ্ঞান',
  'পদার্থ বিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'উচ্চতর গণিত',
  'ভূগোল ও পরিবেশ',
  'ইতিহাস',
  'পৌরনীতি ও সুশাসন',
  'অর্থনীতি',
  'হিসাববিজ্ঞান',
  'ব্যবসায় উদ্যোগ',
  'ফিন্যান্স ও ব্যাংকিং',
  'ইসলাম ধর্ম',
  'হিন্দু ধর্ম',
  'তথ্য ও যোগাযোগ প্রযুক্তি',
  'কম্পিউটার',
  'শারীরিক শিক্ষা',
  'চারু ও কারুকলা',
  'সংগীত',
  'কৃষি শিক্ষা',
  'গার্হস্থ্য বিজ্ঞান',
];
const CLASSES = ['প্লে', 'নার্সারী', 'কেজি', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম', 'একাদশ', 'দ্বাদশ'];
const SECTIONS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
const EMPLOYMENT_TYPES = [
  { value: 'permanent', label: 'স্থায়ী' },
  { value: 'temporary', label: 'অস্থায়ী' },
  { value: 'contractual', label: 'চুক্তিভিত্তিক' },
  { value: 'part_time', label: 'খণ্ডকালীন' },
];
const SALARY_GRADES = ['গ্রেড-১', 'গ্রেড-২', 'গ্রেড-৩', 'গ্রেড-৪', 'গ্রেড-৫', 'গ্রেড-৬', 'গ্রেড-৭', 'গ্রেড-৮', 'গ্রেড-৯', 'গ্রেড-১০'];

export interface TeacherFormData {
  // Personal Info
  employee_id: string;
  full_name: string;
  full_name_bn: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  religion: string;
  nationality: string;
  national_id: string;
  
  // Professional Info
  designation: string;
  department: string;
  subjects_taught: string[];
  assigned_classes: string[];
  assigned_sections: string[];
  
  // Qualification
  education_details: { degree: string; institution: string; year: string }[];
  training_details: { name: string; institution: string; year: string }[];
  experience_years: number;
  
  // Contact Info
  phone: string;
  email: string;
  address: string;
  emergency_contact: string;
  emergency_contact_relation: string;
  
  // Employment
  joining_date: string;
  employment_type: string;
  salary_grade: string;
  bank_account: string;
  bank_name: string;
  
  // System
  create_account: boolean;
}

interface TeacherFormProps {
  formData: TeacherFormData;
  onChange: (data: TeacherFormData) => void;
  isEditing: boolean;
}

export const initialTeacherFormData: TeacherFormData = {
  employee_id: '',
  full_name: '',
  full_name_bn: '',
  date_of_birth: '',
  gender: '',
  blood_group: '',
  religion: '',
  nationality: 'বাংলাদেশী',
  national_id: '',
  designation: '',
  department: '',
  subjects_taught: [],
  assigned_classes: [],
  assigned_sections: [],
  education_details: [{ degree: '', institution: '', year: '' }],
  training_details: [],
  experience_years: 0,
  phone: '',
  email: '',
  address: '',
  emergency_contact: '',
  emergency_contact_relation: '',
  joining_date: '',
  employment_type: 'permanent',
  salary_grade: '',
  bank_account: '',
  bank_name: '',
  create_account: true,
};

export default function TeacherForm({ formData, onChange, isEditing }: TeacherFormProps) {
  const handleChange = (field: keyof TeacherFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleArrayItem = (field: 'subjects_taught' | 'assigned_classes' | 'assigned_sections', item: string) => {
    const current = formData[field];
    if (current.includes(item)) {
      handleChange(field, current.filter((i) => i !== item));
    } else {
      handleChange(field, [...current, item]);
    }
  };

  const addEducation = () => {
    handleChange('education_details', [...formData.education_details, { degree: '', institution: '', year: '' }]);
  };

  const removeEducation = (index: number) => {
    handleChange('education_details', formData.education_details.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...formData.education_details];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('education_details', updated);
  };

  const addTraining = () => {
    handleChange('training_details', [...formData.training_details, { name: '', institution: '', year: '' }]);
  };

  const removeTraining = (index: number) => {
    handleChange('training_details', formData.training_details.filter((_, i) => i !== index));
  };

  const updateTraining = (index: number, field: string, value: string) => {
    const updated = [...formData.training_details];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('training_details', updated);
  };

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="personal" className="text-xs sm:text-sm font-bangla">
          <User className="w-4 h-4 mr-1 hidden sm:inline" /> ব্যক্তিগত
        </TabsTrigger>
        <TabsTrigger value="professional" className="text-xs sm:text-sm font-bangla">
          <Briefcase className="w-4 h-4 mr-1 hidden sm:inline" /> পেশাগত
        </TabsTrigger>
        <TabsTrigger value="qualification" className="text-xs sm:text-sm font-bangla">
          <GraduationCap className="w-4 h-4 mr-1 hidden sm:inline" /> যোগ্যতা
        </TabsTrigger>
        <TabsTrigger value="contact" className="text-xs sm:text-sm font-bangla">
          <Phone className="w-4 h-4 mr-1 hidden sm:inline" /> যোগাযোগ
        </TabsTrigger>
        <TabsTrigger value="employment" className="text-xs sm:text-sm font-bangla">
          <Settings className="w-4 h-4 mr-1 hidden sm:inline" /> চাকরি
        </TabsTrigger>
      </TabsList>

      {/* Personal Information Tab */}
      <TabsContent value="personal" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">কর্মচারী আইডি *</Label>
            <Input
              value={formData.employee_id}
              onChange={(e) => handleChange('employee_id', e.target.value)}
              placeholder="EMP-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">জাতীয় পরিচয়পত্র নম্বর</Label>
            <Input
              value={formData.national_id}
              onChange={(e) => handleChange('national_id', e.target.value)}
              placeholder="10/13/17 ডিজিট"
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
        </div>
      </TabsContent>

      {/* Professional Information Tab */}
      <TabsContent value="professional" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">পদবী *</Label>
            <Select value={formData.designation} onValueChange={(v) => handleChange('designation', v)}>
              <SelectTrigger>
                <SelectValue placeholder="পদবী নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {DESIGNATIONS.map((d) => (
                  <SelectItem key={d} value={d} className="font-bangla">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">বিভাগ</Label>
            <Select value={formData.department} onValueChange={(v) => handleChange('department', v)}>
              <SelectTrigger>
                <SelectValue placeholder="বিভাগ নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d} className="font-bangla">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bangla">পাঠদানের বিষয়সমূহ</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
            {SUBJECTS.map((subject) => (
              <Badge
                key={subject}
                variant={formData.subjects_taught.includes(subject) ? 'default' : 'outline'}
                className="cursor-pointer font-bangla"
                onClick={() => toggleArrayItem('subjects_taught', subject)}
              >
                {subject}
              </Badge>
            ))}
          </div>
          {formData.subjects_taught.length > 0 && (
            <p className="text-sm text-muted-foreground font-bangla">
              নির্বাচিত: {formData.subjects_taught.join(', ')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-bangla">দায়িত্বপ্রাপ্ত শ্রেণী</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
            {CLASSES.map((cls) => (
              <Badge
                key={cls}
                variant={formData.assigned_classes.includes(cls) ? 'default' : 'outline'}
                className="cursor-pointer font-bangla"
                onClick={() => toggleArrayItem('assigned_classes', cls)}
              >
                {cls}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bangla">দায়িত্বপ্রাপ্ত সেকশন</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
            {SECTIONS.map((sec) => (
              <Badge
                key={sec}
                variant={formData.assigned_sections.includes(sec) ? 'default' : 'outline'}
                className="cursor-pointer font-bangla"
                onClick={() => toggleArrayItem('assigned_sections', sec)}
              >
                {sec}
              </Badge>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Qualification Tab */}
      <TabsContent value="qualification" className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-bangla text-base font-semibold">শিক্ষাগত যোগ্যতা</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEducation}>
              <Plus className="w-4 h-4 mr-1" /> <span className="font-bangla">যোগ করুন</span>
            </Button>
          </div>
          
          {formData.education_details.map((edu, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg relative">
              {formData.education_details.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeEducation(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <div className="space-y-1">
                <Label className="text-xs font-bangla">ডিগ্রি</Label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="যেমন: B.A., M.A."
                  className="text-sm"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-bangla">প্রতিষ্ঠান</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="বিশ্ববিদ্যালয়/কলেজের নাম"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bangla">পাশের সন</Label>
                <Input
                  value={edu.year}
                  onChange={(e) => updateEducation(index, 'year', e.target.value)}
                  placeholder="2020"
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="font-bangla text-base font-semibold">প্রশিক্ষণ</Label>
            <Button type="button" variant="outline" size="sm" onClick={addTraining}>
              <Plus className="w-4 h-4 mr-1" /> <span className="font-bangla">যোগ করুন</span>
            </Button>
          </div>
          
          {formData.training_details.map((training, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => removeTraining(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-bangla">প্রশিক্ষণের নাম</Label>
                <Input
                  value={training.name}
                  onChange={(e) => updateTraining(index, 'name', e.target.value)}
                  placeholder="যেমন: B.Ed, C-in-Ed"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bangla">প্রতিষ্ঠান</Label>
                <Input
                  value={training.institution}
                  onChange={(e) => updateTraining(index, 'institution', e.target.value)}
                  placeholder="প্রতিষ্ঠানের নাম"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bangla">সন</Label>
                <Input
                  value={training.year}
                  onChange={(e) => updateTraining(index, 'year', e.target.value)}
                  placeholder="2020"
                  className="text-sm"
                />
              </div>
            </div>
          ))}

          {formData.training_details.length === 0 && (
            <p className="text-sm text-muted-foreground font-bangla text-center py-4">
              কোনো প্রশিক্ষণ যোগ করা হয়নি
            </p>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label className="font-bangla">অভিজ্ঞতা (বছর)</Label>
          <Input
            type="number"
            min="0"
            value={formData.experience_years}
            onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
            className="w-32"
          />
        </div>
      </TabsContent>

      {/* Contact Information Tab */}
      <TabsContent value="contact" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">মোবাইল নম্বর *</Label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">ইমেইল *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="teacher@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">জরুরি যোগাযোগ নম্বর</Label>
            <Input
              value={formData.emergency_contact}
              onChange={(e) => handleChange('emergency_contact', e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">জরুরি যোগাযোগের সম্পর্ক</Label>
            <Input
              value={formData.emergency_contact_relation}
              onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
              placeholder="যেমন: স্বামী, স্ত্রী, ভাই"
              className="font-bangla"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="font-bangla">ঠিকানা</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="বিস্তারিত ঠিকানা"
              className="font-bangla"
              rows={3}
            />
          </div>
        </div>
      </TabsContent>

      {/* Employment Tab */}
      <TabsContent value="employment" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bangla">যোগদানের তারিখ *</Label>
            <Input
              type="date"
              value={formData.joining_date}
              onChange={(e) => handleChange('joining_date', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">চাকরির ধরন</Label>
            <Select value={formData.employment_type} onValueChange={(v) => handleChange('employment_type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="ধরন নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="font-bangla">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">বেতন গ্রেড</Label>
            <Select value={formData.salary_grade} onValueChange={(v) => handleChange('salary_grade', v)}>
              <SelectTrigger>
                <SelectValue placeholder="গ্রেড নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {SALARY_GRADES.map((g) => (
                  <SelectItem key={g} value={g} className="font-bangla">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">ব্যাংকের নাম</Label>
            <Input
              value={formData.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              placeholder="যেমন: সোনালী ব্যাংক"
              className="font-bangla"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bangla">ব্যাংক অ্যাকাউন্ট নম্বর</Label>
            <Input
              value={formData.bank_account}
              onChange={(e) => handleChange('bank_account', e.target.value)}
              placeholder="অ্যাকাউন্ট নম্বর"
            />
          </div>
        </div>

        {!isEditing && formData.email && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mt-4">
            <Checkbox
              id="create_account"
              checked={formData.create_account}
              onCheckedChange={(checked) => handleChange('create_account', !!checked)}
            />
            <label htmlFor="create_account" className="text-sm font-bangla cursor-pointer">
              স্বয়ংক্রিয়ভাবে লগইন অ্যাকাউন্ট তৈরি করুন
            </label>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-bangla">
            <strong>দ্রষ্টব্য:</strong> অ্যাকাউন্ট তৈরি করলে শিক্ষক সিস্টেমে লগইন করতে পারবেন। 
            শিক্ষক উপস্থিতি নেওয়া, ফলাফল প্রবেশ, নোটিশ দেখা ইত্যাদি কাজ করতে পারবেন।
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
