"use client";

import { requestCoreJson } from "@/lib/http/core-request";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TeamInvitationForm } from "@/components/workspace/team-invitation-form";
import { PageHeader } from "@/components/workspace/page-header";

export function TeamMembersManager({ organizationId, spaceId, currentProfileId, actor, initialData, labels }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [pending, setPending] = useState("");
  const [invitations, setInvitations] = useState(initialData.invitations);
  const groups = {
    owner: initialData.members.filter((member) => member.isOwner),
    admin: initialData.members.filter((member) => !member.isOwner && member.role === "admin"),
    member: initialData.members.filter((member) => !member.isOwner && member.role === "member")
  };

  async function mutate(action, values, confirmation, success) {
    if (confirmation && !window.confirm(confirmation)) return;
    setPending(`${action}:${values.membershipId || values.invitationId || organizationId}`);
    setFeedback({ type: "", message: "" });
    try {
      const result = await requestCoreJson("/api/team/management", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, organizationId, spaceId, ...values })
      });
      if (action === "resendInvitation" && result.delivery !== "sent") throw new Error("Email not sent");
      setFeedback({ type: "success", message: success });
      if (action === "revokeInvitation") setInvitations((current) => current.filter((invitation) => invitation.id !== values.invitationId));
      if (action === "leaveTeam") router.push("/espace");
      else router.refresh();
    } catch (error) {
      const result = error.result;
      const message = labels.teamManagement.errors[result?.code] || labels.teamManagement.errors.unexpected_error;
      setFeedback({ type: "error", message: result?.correlationId ? `${message} (${result.correlationId})` : message });
      if (result?.mutationApplied) router.refresh();
    } finally {
      setPending("");
    }
  }

  function MemberRow({ member }) {
    const isSelf = member.profileId === currentProfileId;
    const canChangeRole = actor.isOwner && !member.isOwner;
    const canRemove = !member.isOwner && !isSelf && (actor.isOwner || actor.role === "admin" && member.role === "member");
    return <li className="team-person-row">
      <div className="team-person-identity">
        <strong>{member.displayName}</strong>
        {member.username && <span>@{member.username}</span>}
        <small>{labels.teamManagement.joined} {new Intl.DateTimeFormat(labels.locale, { dateStyle: "medium" }).format(new Date(member.joinedAt))}</small>
      </div>
      <div className="team-person-role">
        <span className={member.isOwner ? "role-badge owner" : "role-badge"}>{member.isOwner ? labels.owner : labels.roles[member.role]}</span>
        {isSelf && <span className="self-label">{labels.teamManagement.you}</span>}
      </div>
      {(canChangeRole || canRemove) && <div className="team-row-actions" aria-label={`${labels.teamManagement.actionsFor} ${member.displayName}`}>
        {canChangeRole && <button disabled={Boolean(pending)} onClick={() => mutate("updateRole", { membershipId: member.membershipId, role: member.role === "admin" ? "member" : "admin" }, "", member.role === "admin" ? labels.teamManagement.demoted : labels.teamManagement.promoted)}>{member.role === "admin" ? labels.teamManagement.demote : labels.teamManagement.promote}</button>}
        {canRemove && <button className="danger" disabled={Boolean(pending)} onClick={() => mutate("removeMember", { membershipId: member.membershipId }, labels.teamManagement.confirmRemove.replace("{name}", member.displayName), labels.teamManagement.removed)}>{labels.teamManagement.remove}</button>}
      </div>}
    </li>;
  }

  return <section className="team-management" aria-labelledby="team-members-title">
    <PageHeader titleId="team-members-title" eyebrow={labels.groups.team} title={labels.teamManagement.members} description={labels.teamManagement.visibility} actions={<Link className="workspace-button workspace-button-secondary" href={`/espace/${spaceId}`}>{labels.teamManagement.backToTeam}</Link>} />
    <p className={`team-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"} aria-live="polite">{feedback.message}</p>

    {[["owner", labels.owner], ["admin", labels.teamManagement.admins], ["member", labels.teamManagement.membersGroup]].map(([key, title]) => <section className={`team-group${groups[key].length ? "" : " is-empty"}`} key={key}>
      <h2>{title} <span>{groups[key].length}</span></h2>
      {groups[key].length ? <ul className="team-people-list">{groups[key].map((member) => <MemberRow member={member} key={member.membershipId} />)}</ul> : <p className="team-empty">{labels.teamManagement.empty[key]}</p>}
    </section>)}

    {(actor.isOwner || actor.role === "admin") && <section className={`team-invitations${invitations.length ? "" : " is-empty"}`} aria-labelledby="pending-invitations-title">
      <h2 id="pending-invitations-title">{labels.teamManagement.pendingInvitations} <span>{invitations.length}</span></h2>
      {invitations.length ? <ul className="team-people-list">{invitations.map((invitation) => <li className="team-person-row" key={invitation.id}>
        <div className="team-person-identity"><strong>{invitation.email}</strong><span>{labels.roles[invitation.role]}</span><small>{labels.teamManagement.expires} {new Intl.DateTimeFormat(labels.locale, { dateStyle: "medium" }).format(new Date(invitation.expiresAt))}</small></div>
        <div className="team-row-actions" aria-label={`${labels.teamManagement.actionsFor} ${invitation.email}`}>
          <button disabled={Boolean(pending)} onClick={() => mutate("resendInvitation", { invitationId: invitation.id }, "", labels.teamManagement.resent)}>{labels.teamManagement.resend}</button>
          <button className="danger" disabled={Boolean(pending)} onClick={() => mutate("revokeInvitation", { invitationId: invitation.id }, labels.teamManagement.confirmRevoke.replace("{email}", invitation.email), labels.teamManagement.revoked)}>{labels.teamManagement.revoke}</button>
        </div>
      </li>)}</ul> : <p className="team-empty">{labels.teamManagement.emptyInvitations}</p>}
      <TeamInvitationForm organizationId={organizationId} spaceId={spaceId} labels={labels} onSuccess={(invitation) => { if (invitation) setInvitations((current) => [...current.filter((item) => item.id !== invitation.id), invitation]); router.refresh(); }} />
    </section>}

    <section className="team-leave" aria-labelledby="leave-team-title">
      <h2 id="leave-team-title">{labels.teamManagement.leave}</h2>
      {actor.isOwner
        ? <p>{labels.teamManagement.ownerCannotLeave}</p>
        : <><p>{labels.teamManagement.leaveHint}</p><button className="danger" disabled={Boolean(pending)} onClick={() => mutate("leaveTeam", {}, labels.teamManagement.confirmLeave, labels.teamManagement.left)}>{labels.teamManagement.leave}</button></>}
    </section>
  </section>;
}
