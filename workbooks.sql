select distinct prm.*
	,su.name as user_name
	,w.name as workbook_name
	,w.description as workbook_description
	,v.name as view_name
	,regexp_replace(v.repository_url, '/sheets'::text, ''::text) AS view_url
	,p.name as project_name
	,s.url_namespace as site_url
	,s.name as site_name
	,tagt.name as topic_tag
	,coalesce(tagv.showtabs,0) as showtabs
	,coalesce(tagv.showtoolbar,0) as showtoolbar
	,coalesce(tagv.responsive,0) as responsive
	,fav.position as fav_position
	,vs.nviews
	,vs.last_view_time
from (

-- User level permissions - Workbook view
select 
	w.id as workbook_id
	,w.site_id
	,u.id as user_id
--	,NULL as group_name
--	,'N' as pl
--	,'N' as sa
from 
	next_gen_permissions ngp
	join users u on ngp.grantee_id = u.id
	join workbooks w on ngp.authorizable_id = w.id
	join capabilities c on ngp.capability_id = c.id
where 
	ngp.grantee_type = 'User'
and ngp.authorizable_type = 'Workbook'
and c.name = 'read'

union all

-- Group level permissions - Workbook view
select 
	w.id as workbook_id
	,w.site_id
	,u.id as user_id
--	,g.name as group_name
--	,'N' as pl
--	,'N' as sa
from 
	next_gen_permissions ngp
	join groups g on ngp.grantee_id = g.id
	join group_users gu on g.id = gu.group_id
	join users u on gu.user_id = u.id
	join workbooks w on ngp.authorizable_id = w.id
	join capabilities c on ngp.capability_id = c.id
where 
	ngp.grantee_type = 'Group'
and ngp.authorizable_type = 'Workbook'
and c.name = 'read'

union all

-- User level permissions - Project leader
select 
	w.id as workbook_id
	,w.site_id
	,u.id as user_id
--	,NULL as group_name
--	,'Y' as pl
--	,'N' as sa
from 
	next_gen_permissions ngp
	join users u on ngp.grantee_id = u.id
	join projects p on ngp.authorizable_id = p.id
	join workbooks w on p.id = w.project_id
	join capabilities c on ngp.capability_id = c.id
where 
	ngp.grantee_type = 'User'
and ngp.authorizable_type = 'Project'
and c.name = 'project_leader'

union all

-- Group level permissions - Project leader
select 
	w.id as workbook_id
	,w.site_id
	,u.id as user_id
--	,g.name as group_name
--	,'Y' as pl
--	,'N' as sa
from 
	next_gen_permissions ngp
	join groups g on ngp.grantee_id = g.id
	join group_users gu on g.id = gu.group_id
	join users u on gu.user_id = u.id
	join projects p on ngp.authorizable_id = p.id
	join workbooks w on p.id = w.project_id
	join capabilities c on ngp.capability_id = c.id
where 
	ngp.grantee_type = 'Group'
and ngp.authorizable_type = 'Project'
and c.name = 'project_leader'

union all

-- User level permissions - Admins
select 
	w.id as workbook_id
	,w.site_id
	,u.id as user_id
--	,NULL as group_name
--	,'N' as pl
--	,'Y' as sa
from 
	workbooks w
	join sites s on w.site_id = s.id
	join users u on s.id = u.site_id
	join system_users su on u.system_user_id = su.id
where 
	su.admin_level=10 -- System Administrator
	or u.site_role_id=0 -- Site Administrator Explorer
	or u.site_role_id=11 -- Site Administrator Creator
) as prm
join workbooks w on w.id = prm.workbook_id
join (
    select
        workbook_id
        ,id as view_id
    from views
    where index=1
) sv on sv.workbook_id = prm.workbook_id
join views v on v.id = sv.view_id
join projects p on p.id = w.project_id
join sites s on s.id = prm.site_id
join users u on u.id = prm.user_id
join system_users su on su.id = u.system_user_id
left join asset_lists al on al.owner_id = u.id and al.site_id = s.id
and al.name = 'favorites'
left join asset_list_items fav on fav.asset_list_id = al.id
and fav. useable_type = 'Workbook'
and fav.useable_id = w.id
left join (
	select
		v.id
		,max(case when t.name='showtabs' and t.id>0 then 1 end) as showtabs
		,max(case when t.name='showtoolbar' and t.id>0 then 1 end) as showtoolbar
		,max(case when t.name='responsive' and t.id>0 then 1 end) as responsive
	from views v
	join taggings tg on tg.taggable_id = v.id
	join tags t on t.id = tg.tag_id
	where tg.taggable_type = 'View'
    group by v.id
) tagv on tagv.id = v.id
left join (
	select
		v.id
		,t.name
	from views v
	join taggings tg on tg.taggable_id = v.id
	join tags t on t.id = tg.tag_id
	where tg.taggable_type = 'View'
	  and t.name like '%/%'
    group by v.id
) tagt on tagt.id = v.id
left join (
select
views_workbook_id
,site_id
,users_id
,sum(nviews) as nviews
,max(last_view_time) as last_view_time
from _views_stats
group by views_workbook_id, site_id, users_id
) vs on vs.views_workbook_id = w.id
and vs.site_id = s.id
and vs.users_id = u.id
where su.state = 'active'