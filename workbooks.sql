select distinct prm.*
	,su.name as user_name
	,v.name as view_name
	,regexp_replace(v.repository_url, '/sheets'::text, ''::text) AS view_url
	,s.url_namespace as site_url
	,s.name as site_name
from (

-- User level permissions - Workbook view
select 
		w.id as workbook_id
	,	w.name as workbook_name
	,	w.site_id
	,	u.id as user_id
--	,	NULL as group_name
--	,	'N' as pl
--	,	'N' as sa
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
	,	w.name as workbook_name
	,	w.site_id
	,	u.id as user_id
--	,	g.name as group_name
--	,	'N' as pl
--	,	'N' as sa
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
	,	w.name as workbook_name
	,	w.site_id
	,	u.id as user_id
--	,	NULL as group_name
--	,	'Y' as pl
--	,	'N' as sa
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
	,	w.name as workbook_name
	,	w.site_id
	,	u.id as user_id
--	,	g.name as group_name
--	,	'Y' as pl
--	,	'N' as sa
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
	,	w.name as workbook_name
	,	w.site_id
	,	u.id as user_id
--	,	NULL as group_name
--	,	'N' as pl
--	,	'Y' as sa
from 
	workbooks w
	join sites s on w.site_id = s.id
	join users u on s.id = u.site_id
	join system_users su on u.system_user_id = su.id
where 
	su.admin_level=10 -- System Administrator
	or u.admin_level=5 -- Site Administrator

) as prm
join views v on v.workbook_id = prm.workbook_id
join sites s on s.id = prm.site_id
join users u on u.id = prm.user_id
join system_users su on su.id = u.system_user_id
where
	su.state = 'active'
and u.site_role_id < 6 -- exclude guest & unlicenced
