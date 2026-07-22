-- D2P Academy | Migration 039
-- Add consentsCompleted + requiresSurveys to get_child_progress for parent panel.

create or replace function public.get_child_progress(p_child_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_own_child(p_child_id) and not public.is_admin() then
    raise exception 'Bu öğrenciye erişim yetkiniz yok' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'enrollmentId', e.id,
        'eventTitle', ev.title,
        'eventDate', ev.start_at,
        'status', e.status,
        'intakeCompleted', e.intake_form_completed_at is not null,
        'consentsCompleted', (
          select
            count(*) filter (where cr.form_type = 'scientific' and cr.accepted) = 1
            and count(*) filter (where cr.form_type = 'participation' and cr.accepted) = 1
            and count(*) filter (
              where cr.form_type = 'media'
                and cr.accepted
                and coalesce((cr.media_permissions->>'photo_capture')::boolean, false)
                and coalesce((cr.media_permissions->>'video_capture')::boolean, false)
                and coalesce((cr.media_permissions->>'website_publish')::boolean, false)
                and coalesce((cr.media_permissions->>'social_media_publish')::boolean, false)
                and coalesce((cr.media_permissions->>'print_materials')::boolean, false)
                and coalesce((cr.media_permissions->>'academic_anonymous_use')::boolean, false)
                and coalesce((cr.media_permissions->>'municipal_reports')::boolean, false)
            ) = 1
          from public.consent_records cr
          where cr.enrollment_id = e.id
        ),
        'preTestCompleted', e.pre_test_completed_at is not null,
        'postTestCompleted', e.post_test_completed_at is not null,
        'requiresSurveys', coalesce(p.grade_level, '') in ('5', '6', '7', '8')
      ) order by ev.start_at desc)
      from public.enrollments e
      join public.events ev on ev.id = e.event_id
      join public.profiles p on p.id = e.user_id
      where e.user_id = p_child_id
    ), '[]'::jsonb),

    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'certificateCode', c.certificate_code,
        'issuedAt', c.issued_at,
        'pdfUrl', c.pdf_url
      ) order by c.issued_at desc)
      from public.certificates c
      where c.user_id = p_child_id
        and c.status = 'active'::public.certificate_status
    ), '[]'::jsonb),

    'badges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', b.name,
        'iconUrl', b.icon_url,
        'awardedAt', sb.awarded_at
      ) order by sb.awarded_at desc)
      from public.student_badges sb
      join public.badges b on b.id = sb.badge_id
      where sb.student_id = p_child_id
    ), '[]'::jsonb),

    'activePrintOrders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', po.id,
        'itemName', po.item_name,
        'status', po.status,
        'requestedAt', po.requested_at
      ) order by po.requested_at desc)
      from public.print_work_orders po
      where po.student_id = p_child_id
        and po.status in ('queued', 'printing', 'ready')
    ), '[]'::jsonb),

    'grades', coalesce((
      select jsonb_agg(jsonb_build_object(
        'documentTitle', d.title,
        'score', g.score,
        'feedback', coalesce(g.feedback, ''),
        'createdAt', g.created_at,
        'documentFileUrl', d.file_url
      ) order by g.created_at desc)
      from public.grades g
      join public.documents d on d.id = g.document_id
      where g.student_id = p_child_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_child_progress(uuid) from public, anon;
grant execute on function public.get_child_progress(uuid) to authenticated;
