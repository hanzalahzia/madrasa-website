"use client";

import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/format";
import type {
  Announcement,
  CrudList,
  EventItem,
  Faq,
  GalleryItem,
  PageContent,
  Program,
  SchoolClass,
  Subject,
  Teacher
} from "@/lib/types";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { ResourceManager, type AdminField } from "@/components/admin/resource-manager";

type AdminPage = PageContent & { _id: string; published?: boolean };

export default function AdminContentPage() {
  const { locale, localized } = useLanguage();
  const [tab, setTab] = useState("pages");
  const [teacherAccount, setTeacherAccount] = useState<Teacher | null>(null);
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [accountSaving, setAccountSaving] = useState(false);

  const programs = useApi<CrudList<Program>>("/admin/programs?limit=200");
  const classes = useApi<CrudList<SchoolClass>>("/admin/classes?limit=200");
  const subjects = useApi<CrudList<Subject>>("/admin/subjects?limit=200");

  const programOptions = useMemo(
    () =>
      (programs.data?.items || []).map((program) => ({
        value: program._id,
        label: localized(program.title) || program.slug
      })),
    [programs.data, localized]
  );
  const classOptions = useMemo(
    () =>
      (classes.data?.items || []).map((schoolClass) => ({
        value: schoolClass._id,
        label: `${schoolClass.name}${schoolClass.section ? ` — ${schoolClass.section}` : ""}`
      })),
    [classes.data]
  );
  const subjectOptions = useMemo(
    () =>
      (subjects.data?.items || []).map((subject) => ({
        value: subject._id,
        label: `${subject.name} (${subject.code})`
      })),
    [subjects.data]
  );

  const pageFields: AdminField[] = [
    { name: "key", label: "Page key", type: "text", required: true, placeholder: "about" },
    { name: "published", label: "Published", type: "checkbox" },
    { name: "title", label: "Title", type: "localized", required: true },
    { name: "body", label: "Body", type: "localizedTextarea", required: true }
  ];

  const programFields: AdminField[] = [
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "title", label: "Title", type: "localized", required: true },
    { name: "summary", label: "Summary", type: "localizedTextarea", required: true },
    { name: "description", label: "Description", type: "localizedTextarea", required: true },
    { name: "duration", label: "Duration", type: "text" },
    { name: "ageGroup", label: "Age group", type: "text" },
    { name: "monthlyFeeNote", label: "Fee note", type: "text" },
    { name: "image", label: "Cover image", type: "image" },
    { name: "order", label: "Display order", type: "number" },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  const teacherFields: AdminField[] = [
    { name: "name", label: "Full name", type: "text", required: true },
    { name: "qualifications", label: "Qualifications", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "bio", label: "Biography", type: "localizedTextarea" },
    { name: "programs", label: "Programs", type: "multiselect", options: programOptions },
    { name: "classes", label: "Classes", type: "multiselect", options: classOptions },
    { name: "subjects", label: "Subjects", type: "multiselect", options: subjectOptions },
    { name: "published", label: "Published on website", type: "checkbox" }
  ];

  const announcementFields: AdminField[] = [
    { name: "title", label: "Title", type: "localized", required: true },
    { name: "body", label: "Body", type: "localizedTextarea", required: true },
    { name: "category", label: "Category", type: "text" },
    { name: "publishDate", label: "Publish date", type: "datetime" },
    { name: "audience", label: "Audience", type: "multiselect", options: [
      { value: "public", label: "Public" },
      { value: "students", label: "Students" },
      { value: "guardians", label: "Guardians" },
      { value: "teachers", label: "Teachers" }
    ] },
    { name: "pinned", label: "Pinned", type: "checkbox" },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  const eventFields: AdminField[] = [
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "title", label: "Title", type: "localized", required: true },
    { name: "description", label: "Description", type: "localizedTextarea", required: true },
    { name: "startDate", label: "Start", type: "datetime", required: true },
    { name: "endDate", label: "End", type: "datetime" },
    { name: "location", label: "Location", type: "localized" },
    { name: "image", label: "Event image", type: "image" },
    { name: "published", label: "Published", type: "checkbox" },
    { name: "featured", label: "Featured", type: "checkbox" }
  ];

  const galleryFields: AdminField[] = [
    { name: "title", label: "Caption", type: "localized" },
    { name: "alt", label: "Alt text", type: "localized" },
    { name: "image", label: "Image", type: "image", required: true },
    { name: "category", label: "Category", type: "text", placeholder: "campus" },
    { name: "order", label: "Display order", type: "number" },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  const faqFields: AdminField[] = [
    { name: "question", label: "Question", type: "localized", required: true },
    { name: "answer", label: "Answer", type: "localizedTextarea", required: true },
    { name: "category", label: "Category", type: "text" },
    { name: "order", label: "Display order", type: "number" },
    { name: "published", label: "Published", type: "checkbox" }
  ];

  const openTeacherAccount = (teacher: Teacher) => {
    setTeacherAccount(teacher);
    setAccount({ name: teacher.name, email: teacher.email || "", password: "" });
  };

  const submitTeacherAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherAccount) return;
    setAccountSaving(true);
    try {
      await api(`/admin/faculty/${teacherAccount._id}/account`, { method: "POST", body: account });
      toast.success("Teacher portal account created");
      setTeacherAccount(null);
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setAccountSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">Website</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Content</h1>
        <p className="mt-1 text-sm text-muted">Manage pages, programs, faculty and public communications.</p>
      </div>

      <Tabs
        tabs={[
          { value: "pages", label: "Pages" },
          { value: "programs", label: "Programs" },
          { value: "faculty", label: "Faculty" },
          { value: "announcements", label: "Announcements" },
          { value: "events", label: "Events" },
          { value: "gallery", label: "Gallery" },
          { value: "faqs", label: "FAQs" }
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "pages" ? (
        <ResourceManager<AdminPage>
          endpoint="/admin/pages"
          title="Pages"
          description="Multilingual content for the public information pages."
          createLabel="Add page"
          keyFor={(page) => page._id}
          fields={pageFields}
          defaults={{ published: true }}
          columns={[
            { key: "key", label: "Key", render: (page) => <span className="font-mono text-xs">{page.key}</span> },
            { key: "title", label: "Title", render: (page) => <span className="font-medium">{localized(page.title)}</span> },
            { key: "updatedAt", label: "Updated", render: (page) => formatDate(page.updatedAt, locale) },
            {
              key: "published",
              label: "Status",
              render: (page) => (page.published === false ? <Badge tone="neutral">Hidden</Badge> : <Badge tone="success">Published</Badge>)
            }
          ]}
        />
      ) : null}

      {tab === "programs" ? (
        <ResourceManager<Program>
          endpoint="/admin/programs"
          title="Programs"
          description="Academic programs shown on the public website."
          createLabel="Add program"
          keyFor={(program) => program._id}
          fields={programFields}
          defaults={{ published: true, order: 0 }}
          columns={[
            { key: "title", label: "Program", render: (program) => <span className="font-medium">{localized(program.title)}</span> },
            { key: "slug", label: "Slug", render: (program) => <span className="font-mono text-xs">{program.slug}</span> },
            { key: "duration", label: "Duration", render: (program) => program.duration || "—" },
            { key: "order", label: "Order", render: (program) => program.order ?? 0 },
            {
              key: "published",
              label: "Status",
              render: (program) => (program.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>)
            }
          ]}
        />
      ) : null}

      {tab === "faculty" ? (
        <ResourceManager<Teacher>
          endpoint="/admin/faculty"
          title="Faculty"
          description="Teacher profiles published on the website."
          createLabel="Add faculty"
          keyFor={(teacher) => teacher._id}
          fields={teacherFields}
          columns={[
            { key: "name", label: "Teacher", render: (teacher) => <span className="font-medium">{teacher.name}</span> },
            { key: "qualifications", label: "Qualifications", render: (teacher) => teacher.qualifications || "—" },
            {
              key: "programs",
              label: "Programs",
              render: (teacher) => (Array.isArray(teacher.programs) ? teacher.programs.length : 0)
            },
            {
              key: "published",
              label: "Status",
              render: (teacher) =>
                teacher.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>
            }
          ]}
          renderActions={(teacher) =>
            teacher.user ? (
              <Badge tone="success">Account</Badge>
            ) : (
              <Button type="button" variant="ghost" size="icon" title="Create portal account" onClick={() => openTeacherAccount(teacher)}>
                <KeyRound className="h-4 w-4" />
              </Button>
            )
          }
        />
      ) : null}

      {tab === "announcements" ? (
        <ResourceManager<Announcement>
          endpoint="/admin/announcements"
          title="Announcements"
          description="News and notices shown across the site and portals."
          createLabel="Add announcement"
          keyFor={(announcement) => announcement._id}
          fields={announcementFields}
          defaults={{ published: true, audience: ["public"], category: "general" }}
          columns={[
            {
              key: "title",
              label: "Announcement",
              render: (announcement) => (
                <div>
                  <p className="font-medium">{localized(announcement.title)}</p>
                  <p className="text-xs text-muted">{announcement.category || "general"}</p>
                </div>
              )
            },
            {
              key: "publishDate",
              label: "Publish date",
              render: (announcement) => formatDate(announcement.publishDate, locale)
            },
            {
              key: "audience",
              label: "Audience",
              render: (announcement) => (
                <div className="flex flex-wrap gap-1">
                  {(announcement.audience || ["public"]).map((entry) => (
                    <Badge key={entry} tone="neutral">
                      {entry}
                    </Badge>
                  ))}
                </div>
              )
            },
            {
              key: "published",
              label: "Status",
              render: (announcement) => (
                <div className="flex gap-1">
                  {announcement.pinned ? <Badge tone="gold">Pinned</Badge> : null}
                  {announcement.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
                </div>
              )
            }
          ]}
        />
      ) : null}

      {tab === "events" ? (
        <ResourceManager<EventItem>
          endpoint="/admin/events"
          title="Events"
          description="Upcoming events, programmes and campus activities."
          createLabel="Add event"
          keyFor={(event) => event._id}
          fields={eventFields}
          columns={[
            { key: "title", label: "Event", render: (event) => <span className="font-medium">{localized(event.title)}</span> },
            { key: "startDate", label: "Starts", render: (event) => formatDate(event.startDate, locale, true) },
            {
              key: "location",
              label: "Location",
              render: (event) => (event.location ? localized(event.location) : "—")
            },
            {
              key: "published",
              label: "Status",
              render: (event) => (
                <div className="flex gap-1">
                  {event.featured ? <Badge tone="gold">Featured</Badge> : null}
                  {event.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
                </div>
              )
            }
          ]}
        />
      ) : null}

      {tab === "gallery" ? (
        <ResourceManager<GalleryItem>
          endpoint="/admin/gallery"
          title="Gallery"
          description="Photos from the madrasa campus and events."
          createLabel="Add photo"
          keyFor={(item) => item._id}
          fields={galleryFields}
          defaults={{ published: true, category: "campus", order: 0 }}
          columns={[
            {
              key: "image",
              label: "Photo",
              render: (item) =>
                item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-12 w-16 rounded-md border object-cover" />
                ) : (
                  "—"
                )
            },
            {
              key: "title",
              label: "Caption",
              render: (item) => <span className="font-medium">{item.title ? localized(item.title) : "—"}</span>
            },
            { key: "category", label: "Category", render: (item) => item.category || "—" },
            { key: "order", label: "Order", render: (item) => item.order ?? 0 },
            {
              key: "published",
              label: "Status",
              render: (item) => (item.published ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Hidden</Badge>)
            }
          ]}
        />
      ) : null}

      {tab === "faqs" ? (
        <ResourceManager<Faq>
          endpoint="/admin/faqs"
          title="FAQ"
          description="Questions and answers displayed on the help page."
          createLabel="Add FAQ"
          keyFor={(faq) => faq._id}
          fields={faqFields}
          defaults={{ published: true, order: 0, category: "general" }}
          columns={[
            {
              key: "question",
              label: "Question",
              render: (faq) => <span className="font-medium">{localized(faq.question)}</span>
            },
            { key: "category", label: "Category", render: (faq) => faq.category || "general" },
            { key: "order", label: "Order", render: (faq) => faq.order ?? 0 }
          ]}
        />
      ) : null}

      <Modal
        open={Boolean(teacherAccount)}
        onClose={() => setTeacherAccount(null)}
        title="Create teacher portal account"
        description={teacherAccount?.name}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTeacherAccount(null)}>
              Cancel
            </Button>
            <Button type="submit" form="teacher-account-form" loading={accountSaving}>
              Create account
            </Button>
          </div>
        }
      >
        <form id="teacher-account-form" onSubmit={submitTeacherAccount} className="space-y-4">
          <FormField label="Display name">
            <Input value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={account.email}
              onChange={(event) => setAccount({ ...account, email: event.target.value })}
              required
            />
          </FormField>
          <FormField label="Temporary password" required hint="Minimum 8 characters with a letter and a number.">
            <Input
              value={account.password}
              onChange={(event) => setAccount({ ...account, password: event.target.value })}
              required
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
