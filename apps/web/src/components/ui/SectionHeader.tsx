import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="app-section-header">
      <div className="app-section-header__body">
        <h2 className="app-section-header__title">{title}</h2>
        {description ? <p className="app-section-header__desc">{description}</p> : null}
      </div>
      {actions ? <div className="app-section-header__actions">{actions}</div> : null}
    </div>
  );
}
